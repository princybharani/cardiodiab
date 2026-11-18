"""
CardioDiab Multi-Engine Medical Document Extractor
Supports:
1. Native Windows Media OCR (high-speed local OCR for PNG/JPG/Scanned reports)
2. Pure Python Decompressed Stream PDF Reader (for digital lab PDFs)
3. Medical Report Text Normalizer
"""

import os
import re
import zlib
import subprocess
from PIL import Image, ImageEnhance, ImageFilter

PS_SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "win_ocr.ps1")
PS_PDF_SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "win_pdf_ocr.ps1")

def preprocess_image_for_ocr(input_path: str) -> str:
    """Preprocesses image to enhance text clarity for OCR engine."""
    try:
        with Image.open(input_path) as img:
            # Convert to RGB if needed
            if img.mode != "RGB":
                img = img.convert("RGB")
            
            # Upscale if image is small
            w, h = img.size
            if w < 1200:
                scale = 1200 / w
                img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.8)
            
            # Enhance sharpness
            sharpener = ImageEnhance.Sharpness(img)
            img = sharpener.enhance(1.5)
            
            preprocessed_path = os.path.splitext(input_path)[0] + "_preproc.png"
            img.save(preprocessed_path, format="PNG")
            return preprocessed_path
    except Exception as e:
        print(f"[!] Image preprocessing fallback: {e}")
        return input_path

def extract_text_from_image(file_path: str) -> str:
    """Uses Windows Media OCR Engine to recognize text from medical report image."""
    enhanced_path = preprocess_image_for_ocr(file_path)
    try:
        target_path = enhanced_path if os.path.exists(enhanced_path) else file_path
        cmd = [
            "powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
            "-File", PS_SCRIPT_PATH,
            "-ImagePath", os.path.abspath(target_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
        text = res.stdout.strip()
        if not text and res.stderr:
            print(f"[!] OCR stderr: {res.stderr}")
        return text
    except Exception as e:
        print(f"[!] Error in image OCR: {e}")
        return ""
    finally:
        if enhanced_path != file_path and os.path.exists(enhanced_path):
            try:
                os.remove(enhanced_path)
            except Exception:
                pass

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from digital or scanned PDF documents.
    Primary: Native Windows Media OCR via Windows.Data.Pdf rendering.
    Fallback: Stream decompression and text operator extraction.
    """
    # 1. Primary Engine: Windows Media OCR via Windows.Data.Pdf
    try:
        if os.path.exists(PS_PDF_SCRIPT_PATH):
            cmd = [
                "powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
                "-File", PS_PDF_SCRIPT_PATH,
                "-PdfPath", os.path.abspath(file_path)
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            ocr_text = res.stdout.strip()
            if len(ocr_text) > 40:
                return ocr_text
    except Exception as e:
        print(f"[!] WinRT PDF OCR fallback: {e}")

    # 2. Universal PDF Parser for Cloud/Linux environments (pypdf)
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        pypdf_text = "\n".join([page.extract_text() or "" for page in reader.pages]).strip()
        if len(pypdf_text) > 40:
            return pypdf_text
    except Exception as e:
        pass

    # 3. Fallback: Native zlib decompression and PDF operator parsing
    text_pieces = []
    try:
        with open(file_path, "rb") as f:
            content = f.read()
            
        # 1. Search for FlateDecode streams
        stream_regex = re.compile(rb"stream[\r\n]+(.*?)[\r\n]+endstream", re.DOTALL)
        matches = stream_regex.findall(content)
        
        for m in matches:
            decompressed = None
            try:
                decompressed = zlib.decompress(m)
            except Exception:
                try:
                    decompressed = zlib.decompress(m, -15)
                except Exception:
                    decompressed = m  # uncompressed stream
            
            if decompressed:
                try:
                    stream_str = decompressed.decode("latin-1", errors="ignore")
                    # Extract text inside Tj and TJ operators
                    # Format: (Text) Tj  or  [(Text) -10 (More)] TJ
                    tj_matches = re.findall(r"\((.*?)\)\s*Tj", stream_str)
                    for tj in tj_matches:
                        clean_tj = tj.replace(r"\)", ")").replace(r"\(", "(").replace(r"\n", " ").replace(r"\r", " ")
                        text_pieces.append(clean_tj)
                    
                    # Extract from TJ arrays
                    tj_arrays = re.findall(r"\[(.*?)\]\s*TJ", stream_str, re.DOTALL)
                    for arr in tj_arrays:
                        inner_texts = re.findall(r"\((.*?)\)", arr)
                        combined = "".join(inner_texts).replace(r"\)", ")").replace(r"\(", "(")
                        if combined.strip():
                            text_pieces.append(combined)
                            
                except Exception:
                    continue
                    
        # 2. Also search for raw ASCII text patterns in uncompressed PDF chunks
        direct_strings = re.findall(r"\(([A-Za-z0-9\s\.\:\,\-\/\%\<\>\=]{4,})\)", content.decode("latin-1", errors="ignore"))
        for s in direct_strings:
            if any(term in s.lower() for term in ["glucose", "cholesterol", "hba1c", "blood", "pressure", "mg/dl", "creatinine"]):
                text_pieces.append(s)
                
    except Exception as e:
        print(f"[!] Error in PDF text extraction: {e}")
        
    full_text = "\n".join(text_pieces).strip()
    return full_text

def extract_text_from_file(file_path: str, filename: str = "") -> str:
    """Unified file text extractor handling PDF, Images, and Text."""
    ext = os.path.splitext(filename or file_path)[1].lower()
    
    if ext == ".pdf":
        text = extract_text_from_pdf(file_path)
        if len(text.strip()) > 30:
            return text
        # If PDF was scanned / flat image inside PDF, try image extraction if converted or return raw text
        return text
    elif ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"]:
        return extract_text_from_image(file_path)
    elif ext in [".txt", ".csv", ".json"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    else:
        # Default try image then pdf
        img_text = extract_text_from_image(file_path)
        if len(img_text.strip()) > 20:
            return img_text
        return extract_text_from_pdf(file_path)
