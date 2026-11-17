"""
CardioDiab Supabase Database Client & Fallback Local Storage
Provides persistent storage for uploaded reports, extracted biomarkers,
MCQ answers, and final risk assessments with Supabase Auth & user separation.
"""

import os
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.config import settings

LOCAL_DB_FILE = os.path.join(os.path.dirname(__file__), "..", "local_db.json")
ENV_FILE = os.path.join(os.path.dirname(__file__), "..", ".env")

def get_utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

class DatabaseClient:
    def __init__(self):
        self.supabase = None
        self.use_supabase = False
        self._init_client()

    def _init_client(self):
        url = settings.SUPABASE_URL or os.getenv("SUPABASE_URL")
        key = settings.SUPABASE_KEY or os.getenv("SUPABASE_KEY")
        if url and key and "supabase.co" in url:
            try:
                from supabase import create_client
                self.supabase = create_client(url, key)
                self.use_supabase = True
                print(f"[+] Connected to Supabase at {url}")
            except Exception as e:
                print(f"[!] Could not connect to Supabase ({e}), using local persistence fallback.")
                self.use_supabase = False
        else:
            print("[i] Supabase credentials not set or incomplete. Using built-in local JSON persistence.")
            self.use_supabase = False

        if not os.path.exists(LOCAL_DB_FILE):
            self._save_local_db({
                "patient_reports": [],
                "extracted_biomarkers": [],
                "mcq_responses": [],
                "risk_assessments": []
            })

    def reconnect(self, url: str, key: str) -> Dict[str, Any]:
        """Dynamically test and save new Supabase credentials."""
        if not url or not key:
            return {"success": False, "message": "Both Supabase URL and Key are required."}
        try:
            from supabase import create_client
            client = create_client(url, key)
            # Test ping query
            client.table("patient_reports").select("id").limit(1).execute()
            self.supabase = client
            self.use_supabase = True
            settings.SUPABASE_URL = url
            settings.SUPABASE_KEY = key
            
            # Persist to .env
            env_content = f"SUPABASE_URL={url}\nSUPABASE_KEY={key}\nENVIRONMENT=development\n"
            with open(ENV_FILE, "w", encoding="utf-8") as f:
                f.write(env_content)
                
            return {"success": True, "message": f"Successfully connected to Supabase ({url})!"}
        except Exception as e:
            err_msg = str(e)
            return {"success": False, "message": f"Supabase connection test failed: {err_msg}"}

    def get_status(self) -> Dict[str, Any]:
        url = settings.SUPABASE_URL or os.getenv("SUPABASE_URL") or ""
        masked_url = url[:25] + "..." if len(url) > 25 else url
        return {
            "use_supabase": self.use_supabase,
            "supabase_url": masked_url if self.use_supabase else None,
            "connected": self.use_supabase
        }

    def _read_local_db(self) -> Dict[str, List[Any]]:
        try:
            with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"patient_reports": [], "extracted_biomarkers": [], "mcq_responses": [], "risk_assessments": []}

    def _save_local_db(self, data: Dict[str, List[Any]]):
        try:
            with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            print(f"[!] Error saving local db: {e}")

    def save_patient_report(self, file_name: str, file_type: str, report_type: str, raw_text: str, user_id: Optional[str] = None) -> str:
        report_id = str(uuid.uuid4())
        created_at = get_utc_now_iso()
        
        record = {
            "id": report_id,
            "user_id": user_id,
            "file_name": file_name,
            "file_type": file_type,
            "report_type": report_type,
            "raw_extracted_text": raw_text[:5000],
            "created_at": created_at
        }
        
        if self.use_supabase:
            try:
                # Remove user_id if null to avoid FK constraints if guest
                rec = {k: v for k, v in record.items() if v is not None}
                self.supabase.table("patient_reports").insert(rec).execute()
                return report_id
            except Exception as e:
                print(f"[!] Supabase insert error for patient_reports: {e}")
                
        # Local fallback
        db = self._read_local_db()
        db["patient_reports"].insert(0, record)
        self._save_local_db(db)
        return report_id

    def save_biomarkers(self, report_id: str, biomarkers: Dict[str, Any]):
        records = []
        for key, item in biomarkers.items():
            records.append({
                "id": str(uuid.uuid4()),
                "report_id": report_id,
                "biomarker_key": key,
                "display_name": item.get("display_name", key),
                "value": float(item.get("value", 0)),
                "unit": item.get("unit", ""),
                "status": item.get("status", "normal"),
                "reference_min": float(item.get("reference_min", 0)),
                "reference_max": float(item.get("reference_max", 0)),
                "created_at": get_utc_now_iso()
            })
            
        if self.use_supabase and records:
            try:
                self.supabase.table("extracted_biomarkers").insert(records).execute()
                return
            except Exception as e:
                print(f"[!] Supabase insert error for biomarkers: {e}")
                
        db = self._read_local_db()
        db["extracted_biomarkers"].extend(records)
        self._save_local_db(db)

    def save_mcq_responses(self, report_id: str, mcq_answers: Dict[str, Any]):
        records = []
        for q_id, ans in mcq_answers.items():
            records.append({
                "id": str(uuid.uuid4()),
                "report_id": report_id,
                "question_key": q_id,
                "question_text": ans.get("question_text", q_id),
                "selected_option": ans.get("selected_text", str(ans.get("option_id", ""))),
                "is_positive": bool(ans.get("is_positive", False)),
                "created_at": get_utc_now_iso()
            })
            
        if self.use_supabase and records:
            try:
                self.supabase.table("mcq_responses").insert(records).execute()
                return
            except Exception as e:
                print(f"[!] Supabase insert error for mcq_responses: {e}")
                
        db = self._read_local_db()
        db["mcq_responses"].extend(records)
        self._save_local_db(db)

    def save_risk_assessment(self, report_id: str, report_data: Dict[str, Any], user_id: Optional[str] = None) -> str:
        assessment_id = str(uuid.uuid4())
        urgency = report_data.get("urgency", {})
        diabetes = report_data.get("diabetes_assessment", {})
        cvd = report_data.get("cardiovascular_assessment", {})
        
        record = {
            "id": assessment_id,
            "report_id": report_id,
            "user_id": user_id,
            "urgency_level": urgency.get("urgency_level", "low"),
            "urgency_color": urgency.get("urgency_color", "green"),
            "urgency_title": urgency.get("urgency_title", "Low Risk"),
            "urgency_explanation": urgency.get("urgency_explanation", ""),
            "diabetes_risk_score": float(diabetes.get("risk_score_pct", 0)),
            "diabetes_risk_label": diabetes.get("risk_label", ""),
            "cvd_risk_score": float(cvd.get("risk_score_pct", 0)),
            "cvd_risk_label": cvd.get("risk_label", ""),
            "dietary_guidance": report_data.get("dietary_guidance", {}),
            "lifestyle_recommendations": report_data.get("lifestyle_advice", {}),
            "follow_up_tests": report_data.get("follow_up_tests", []),
            "created_at": get_utc_now_iso()
        }
        
        if self.use_supabase:
            try:
                rec = {k: v for k, v in record.items() if v is not None}
                self.supabase.table("risk_assessments").insert(rec).execute()
                return assessment_id
            except Exception as e:
                print(f"[!] Supabase insert error for risk_assessments: {e}")
                
        db = self._read_local_db()
        db["risk_assessments"].insert(0, record)
        self._save_local_db(db)
        return assessment_id

    def get_recent_history(self, limit: int = 15, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.use_supabase:
            try:
                query = self.supabase.table("risk_assessments")\
                    .select("*, patient_reports(file_name, report_type)")\
                    .order("created_at", desc=True)
                if user_id:
                    query = query.eq("user_id", user_id)
                res = query.limit(limit).execute()
                return res.data
            except Exception as e:
                print(f"[!] Supabase query history error: {e}")
                
        db = self._read_local_db()
        reports_map = {r["id"]: r for r in db.get("patient_reports", [])}
        history = []
        for ass in db.get("risk_assessments", []):
            if user_id and ass.get("user_id") and ass.get("user_id") != user_id:
                continue
            rep = reports_map.get(ass.get("report_id"), {})
            item = dict(ass)
            item["file_name"] = rep.get("file_name", "Medical Report")
            item["report_type"] = rep.get("report_type", "Health Panel")
            history.append(item)
            if len(history) >= limit:
                break
        return history

db_client = DatabaseClient()
