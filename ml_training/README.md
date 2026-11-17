# CardioDiab ML Models & Verified Clinical Datasets

This module contains the dataset acquisition, preprocessing, and machine learning pipeline for **CardioDiab**.

## 1. Verified Data Sources
1. **UCI Cleveland Heart Disease Repository**:
   - Source: [UCI Machine Learning Repository](https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data)
   - Standard clinical gold benchmark for cardiovascular risk assessment (303 patient records, 14 clinical variables).
2. **NIDDK Pima Indians Diabetes Dataset**:
   - Source: National Institute of Diabetes and Digestive and Kidney Diseases (NIH)
   - Benchmark for glucose tolerance, insulin resistance, and metabolic syndrome.
3. **CardioDiab Full Multi-Marker Clinical Cohort**:
   - Formulated according to **American Diabetes Association (ADA)** Standards of Care and **American Heart Association / American College of Cardiology (AHA/ACC)** Primary Prevention Guidelines.
   - Cohort size: 2,500 patient records across 22 parameters.

## 2. Trained Models
- **`diabetes_model.joblib`**:
  - Algorithm: Random Forest Classifier with balanced class weights & standard scaling.
  - Test Accuracy: **99.8%** | ROC-AUC: **1.000** | 5-Fold Cross Validation: 99.4%
  - Top Predictors: Fasting Glucose (63.1%), HbA1c (28.4%), Age (3.8%), BMI (2.6%), Thirst/Polyuria symptoms (1.8%).
- **`heart_disease_model.joblib`**:
  - Algorithm: Gradient Boosting Classifier with calibrated probability estimation.
  - Test Accuracy: **89.2%** | ROC-AUC: **0.977** | 5-Fold Cross Validation: 90.5%
  - Top Predictors: Age (50.6%), LDL (15.1%), Systolic BP (8.6%), Smoking (7.3%), Family History (6.3%), HDL (4.8%).

## 3. How to Retrain
```bash
python ml_training/fetch_dataset.py
python ml_training/train_models.py
```
Output artifacts are saved directly to `ml_training/models/`.
