"""Add session staff/queue/intake tables if missing

Revision ID: f1a2b3c4d5e6
Revises: 15a1b2c3d4e5
Create Date: 2026-02-13 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "15a1b2c3d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS session_staff (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            schedule_session_id VARCHAR(36) NOT NULL,
            staff_id VARCHAR(36) NOT NULL,
            role VARCHAR(50) NOT NULL,
            assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            assigned_by VARCHAR(36) NULL,
            INDEX ix_session_staff_schedule_session_id (schedule_session_id),
            INDEX ix_session_staff_staff_id (staff_id),
            CONSTRAINT uq_session_staff_assignment UNIQUE (schedule_session_id, staff_id, role),
            CONSTRAINT fk_session_staff_schedule_session FOREIGN KEY (schedule_session_id) REFERENCES schedule_session(id),
            CONSTRAINT fk_session_staff_staff FOREIGN KEY (staff_id) REFERENCES user(id),
            CONSTRAINT fk_session_staff_assigned_by FOREIGN KEY (assigned_by) REFERENCES user(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS session_queue (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            schedule_session_id VARCHAR(36) NOT NULL,
            current_doctor_slot INT NOT NULL DEFAULT 0,
            current_nurse_slot INT NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_by VARCHAR(36) NULL,
            CONSTRAINT uq_session_queue_schedule_session UNIQUE (schedule_session_id),
            CONSTRAINT fk_session_queue_schedule_session FOREIGN KEY (schedule_session_id) REFERENCES schedule_session(id),
            CONSTRAINT fk_session_queue_updated_by FOREIGN KEY (updated_by) REFERENCES user(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS session_intake (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            schedule_session_id VARCHAR(36) NOT NULL,
            slot_index INT NOT NULL,
            question_id VARCHAR(36) NOT NULL,
            answer_text TEXT NOT NULL,
            patient_id VARCHAR(36) NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_by VARCHAR(36) NULL,
            INDEX ix_session_intake_schedule_session_id (schedule_session_id),
            INDEX ix_session_intake_question_id (question_id),
            INDEX ix_session_intake_patient_id (patient_id),
            CONSTRAINT uq_session_intake_slot_question UNIQUE (schedule_session_id, slot_index, question_id),
            CONSTRAINT fk_session_intake_schedule_session FOREIGN KEY (schedule_session_id) REFERENCES schedule_session(id),
            CONSTRAINT fk_session_intake_question FOREIGN KEY (question_id) REFERENCES doctor_main_question(id),
            CONSTRAINT fk_session_intake_patient FOREIGN KEY (patient_id) REFERENCES patient(id),
            CONSTRAINT fk_session_intake_updated_by FOREIGN KEY (updated_by) REFERENCES user(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS session_intake")
    op.execute("DROP TABLE IF EXISTS session_queue")
    op.execute("DROP TABLE IF EXISTS session_staff")
