"""Add patient sessions, profiles, and question categories

Revision ID: 15a1b2c3d4e5
Revises: 314b64530b38
Create Date: 2026-02-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "15a1b2c3d4e5"
down_revision: Union[str, None] = "314b64530b38"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "schedule_session",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("schedule_id", sa.String(36), nullable=True),
        sa.Column("doctor_id", sa.String(36), nullable=False, index=True),
        sa.Column("branch_id", sa.String(36), nullable=False, index=True),
        sa.Column("session_date", sa.Date, nullable=False, index=True),
        sa.Column("start_time", sa.Time, nullable=False),
        sa.Column("end_time", sa.Time, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("session_key", sa.String(200), nullable=False),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=True),
        sa.UniqueConstraint("session_key", name="uq_schedule_session_key"),
    )
    op.create_foreign_key("fk_schedule_session_schedule", "schedule_session", "doctor_schedule", ["schedule_id"], ["id"])
    op.create_foreign_key("fk_schedule_session_doctor", "schedule_session", "doctor", ["doctor_id"], ["id"])
    op.create_foreign_key("fk_schedule_session_branch", "schedule_session", "branch", ["branch_id"], ["id"])
    op.create_foreign_key("fk_schedule_session_created_by", "schedule_session", "user", ["created_by"], ["id"])

    op.create_table(
        "patient_profile",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("patient_id", sa.String(36), nullable=False, unique=True),
        sa.Column("sex", sa.String(20), nullable=True),
        sa.Column("age", sa.Integer, nullable=True),
        sa.Column("height_cm", sa.Float, nullable=True),
        sa.Column("weight_kg", sa.Float, nullable=True),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_foreign_key("fk_patient_profile_patient", "patient_profile", "patient", ["patient_id"], ["id"])
    op.create_foreign_key("fk_patient_profile_created_by", "patient_profile", "user", ["created_by"], ["id"])

    op.create_table(
        "patient_session",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("appointment_id", sa.String(36), nullable=False, index=True),
        sa.Column("schedule_session_id", sa.String(36), nullable=True),
        sa.Column("patient_id", sa.String(36), nullable=False, index=True),
        sa.Column("doctor_id", sa.String(36), nullable=False, index=True),
        sa.Column("branch_id", sa.String(36), nullable=False, index=True),
        sa.Column("intake_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("sex", sa.String(20), nullable=True),
        sa.Column("age", sa.Integer, nullable=True),
        sa.Column("height_cm", sa.Float, nullable=True),
        sa.Column("weight_kg", sa.Float, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_foreign_key("fk_patient_session_appointment", "patient_session", "appointment", ["appointment_id"], ["id"])
    op.create_foreign_key("fk_patient_session_schedule", "patient_session", "schedule_session", ["schedule_session_id"], ["id"])
    op.create_foreign_key("fk_patient_session_patient", "patient_session", "patient", ["patient_id"], ["id"])
    op.create_foreign_key("fk_patient_session_doctor", "patient_session", "doctor", ["doctor_id"], ["id"])
    op.create_foreign_key("fk_patient_session_branch", "patient_session", "branch", ["branch_id"], ["id"])
    op.create_foreign_key("fk_patient_session_created_by", "patient_session", "user", ["created_by"], ["id"])

    op.create_table(
        "patient_question_answer",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("patient_profile_id", sa.String(36), nullable=False, index=True),
        sa.Column("patient_id", sa.String(36), nullable=False, index=True),
        sa.Column("question_id", sa.String(36), nullable=False, index=True),
        sa.Column("answer_text", sa.Text, nullable=False),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("session_id", sa.String(36), nullable=True),
        sa.Column("appointment_id", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_foreign_key("fk_patient_qa_profile", "patient_question_answer", "patient_profile", ["patient_profile_id"], ["id"])
    op.create_foreign_key("fk_patient_qa_patient", "patient_question_answer", "patient", ["patient_id"], ["id"])
    op.create_foreign_key("fk_patient_qa_question", "patient_question_answer", "doctor_main_question", ["question_id"], ["id"])
    op.create_foreign_key("fk_patient_qa_created_by", "patient_question_answer", "user", ["created_by"], ["id"])
    op.create_foreign_key("fk_patient_qa_session", "patient_question_answer", "patient_session", ["session_id"], ["id"])
    op.create_foreign_key("fk_patient_qa_appointment", "patient_question_answer", "appointment", ["appointment_id"], ["id"])

    op.add_column("doctor_main_question", sa.Column("category", sa.String(100), nullable=True))

    op.add_column("appointment", sa.Column("schedule_id", sa.String(36), nullable=True))
    op.add_column("appointment", sa.Column("schedule_session_id", sa.String(36), nullable=True))
    op.create_foreign_key("fk_appointment_schedule", "appointment", "doctor_schedule", ["schedule_id"], ["id"])
    op.create_foreign_key("fk_appointment_schedule_session", "appointment", "schedule_session", ["schedule_session_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_appointment_schedule_session", "appointment", type_="foreignkey")
    op.drop_constraint("fk_appointment_schedule", "appointment", type_="foreignkey")
    op.drop_column("appointment", "schedule_session_id")
    op.drop_column("appointment", "schedule_id")

    op.drop_column("doctor_main_question", "category")

    op.drop_table("patient_question_answer")
    op.drop_table("patient_session")
    op.drop_table("patient_profile")
    op.drop_table("schedule_session")
