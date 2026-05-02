"""Dashboard aggregation endpoint."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Call, Lead
from app.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    total_leads = (await db.execute(select(func.count(Lead.id)))).scalar_one()
    calls_made = (await db.execute(select(func.count(Call.id)))).scalar_one()
    hot = (await db.execute(select(func.count(Lead.id)).where(Lead.current_classification == "Hot"))).scalar_one()
    warm = (await db.execute(select(func.count(Lead.id)).where(Lead.current_classification == "Warm"))).scalar_one()
    cold = (await db.execute(select(func.count(Lead.id)).where(Lead.current_classification == "Cold"))).scalar_one()
    signed_up = (await db.execute(select(func.count(Call.id)).where(Call.cta_outcome == "signed_up"))).scalar_one()

    conversion_rate = round((signed_up / total_leads * 100), 1) if total_leads else 0.0

    funnel = [
        {"stage": "Total Leads", "value": total_leads},
        {"stage": "Calls Made", "value": calls_made},
        {"stage": "Hot Leads", "value": hot},
        {"stage": "Signed Up", "value": signed_up},
    ]

    # Daily activity for last 7 days
    daily_activity = []
    for i in range(6, -1, -1):
        day_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        calls_day = (await db.execute(
            select(func.count(Call.id)).where(Call.started_at >= day_start, Call.started_at < day_end)
        )).scalar_one()
        hot_day = (await db.execute(
            select(func.count(Call.id)).where(
                Call.started_at >= day_start,
                Call.started_at < day_end,
                Call.classification == "Hot",
            )
        )).scalar_one()
        daily_activity.append({
            "date": day_start.strftime("%d %b"),
            "calls": calls_day,
            "hot": hot_day,
        })

    return DashboardStats(
        total_leads=total_leads,
        calls_made=calls_made,
        hot_leads=hot,
        warm_leads=warm,
        cold_leads=cold,
        signed_up=signed_up,
        conversion_rate=conversion_rate,
        funnel=funnel,
        daily_activity=daily_activity,
    )
