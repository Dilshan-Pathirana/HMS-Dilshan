"""add consultation tables

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "consultation",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("appointment_id", sa.String(36), sa.ForeignKey("appointment.id"), nullable=True),
        sa.Column("doctor_id", sa.String(36), sa.ForeignKey("doctor.id"), nullable=False, index=True),
        sa.Column("patient_id", sa.String(36), sa.ForeignKey("patient.id"), nullable=False, index=True),
        sa.Column("branch_id", sa.String(36), sa.ForeignKey("branch.id"), nullable=False, index=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="in_progress"),
        sa.Column("chief_complaint", sa.Text(), nullable=True),
        sa.Column("history", sa.Text(), nullable=True),
        sa.Column("examination", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "consultation_diagnosis",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("consultation_id", sa.String(36), sa.ForeignKey("consultation.id"), nullable=False, index=True),
        sa.Column("diagnosis_code", sa.String(20), nullable=True),
        sa.Column("diagnosis_name", sa.String(255), nullable=False),
        sa.Column("diagnosis_type", sa.String(20), nullable=False, server_default="primary"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "consultation_prescription",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("consultation_id", sa.String(36), sa.ForeignKey("consultation.id"), nullable=False, index=True),
        sa.Column("medicine_name", sa.String(255), nullable=False),
        sa.Column("dosage", sa.String(100), nullable=True),
        sa.Column("frequency", sa.String(100), nullable=True),
        sa.Column("duration", sa.String(100), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "consultation_question",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("consultation_id", sa.String(36), sa.ForeignKey("consultation.id"), nullable=False, index=True),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=True),
        sa.Column("question_bank_id", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "investigation",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("consultation_id", sa.String(36), sa.ForeignKey("consultation.id"), nullable=False, index=True),
        sa.Column("patient_id", sa.String(36), sa.ForeignKey("patient.id"), nullable=False, index=True),
        sa.Column("investigation_type", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="ordered"),
        sa.Column("results", sa.Text(), nullable=True),
        sa.Column("ordered_by", sa.String(36), nullable=False),
        sa.Column("ordered_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("investigation")
    op.drop_table("consultation_question")
    op.drop_table("consultation_prescription")
    op.drop_table("consultation_diagnosis")
    op.drop_table("consultation")
