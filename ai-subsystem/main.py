"""
FastAPI Server for Agent 2 Crop Diagnostic Subsystem.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from agents.schemas.crop_analysis_contracts import CropSymptomInput, CropAnalysisReport
from agents.agent2_crop_analysis import run_crop_analysis_agent

app = FastAPI(
    title="AgriOps Agent 2 Subsystem",
    description="AI-powered Crop Diagnostic and Action Recommendation Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "online", "agent": "Agent 2 - Crop Analysis Subsystem"}


@app.post("/analyze-crop", response_model=CropAnalysisReport)
def analyze_crop(input_data: CropSymptomInput):
    try:
        report = run_crop_analysis_agent(input_data)
        return report
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))
