from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from database import Call, get_db

router = APIRouter()


class CallResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    store_name: str
    phone_number: str
    called_at: datetime
    answered: bool
    outcome: str
    pickup_scheduled: bool
    notes: str | None


class StatsResponse(BaseModel):
    total: int
    agreed: int
    rejected: int
    callback: int
    no_answer: int


class TriggerRequest(BaseModel):
    store_name: str
    phone_number: str


@router.get("/calls/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    calls = db.query(Call).all()
    outcomes = [c.outcome for c in calls]
    return StatsResponse(
        total=len(outcomes),
        agreed=outcomes.count("agreed"),
        rejected=outcomes.count("rejected"),
        callback=outcomes.count("callback"),
        no_answer=outcomes.count("no_answer"),
    )


@router.get("/calls", response_model=list[CallResponse])
async def get_calls(db: Session = Depends(get_db)):
    return db.query(Call).order_by(Call.called_at.desc()).all()


@router.post("/calls/trigger", response_model=CallResponse)
async def trigger_call(req: TriggerRequest, db: Session = Depends(get_db)):
    call = Call(
        store_name=req.store_name,
        phone_number=req.phone_number,
        outcome="no_answer",
        answered=False,
        pickup_scheduled=False,
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return call
