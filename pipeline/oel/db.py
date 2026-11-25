import json
import os
from contextlib import contextmanager

import psycopg

from . import __version__


def connect():
    url = os.environ.get("DATABASE_INGEST_URL")
    if not url:
        raise SystemExit("DATABASE_INGEST_URL is not set (see .env.example)")
    return psycopg.connect(url)


@contextmanager
def run(conn, command: str, dataset_slug: str | None, params: dict):
    """Records every pipeline execution in ingestion_runs. Data writes commit only on success."""
    with conn.cursor() as cur:
        cur.execute(
            "insert into ingestion_runs (command, dataset_slug, pipeline_version, parameters) values (%s,%s,%s,%s) returning id",
            (command, dataset_slug, __version__, json.dumps(params, default=str)),
        )
        run_id = cur.fetchone()[0]
    conn.commit()
    state = {"rows": 0, "message": None}
    try:
        yield run_id, state
        conn.commit()
        status = "succeeded"
    except BaseException as e:
        conn.rollback()
        state["message"] = f"{type(e).__name__}: {e}"
        status = "failed"
        raise
    finally:
        with conn.cursor() as cur:
            cur.execute(
                "update ingestion_runs set finished_at=now(), status=%s, rows_written=%s, message=%s where id=%s",
                (status, state["rows"], state["message"], run_id),
            )
        conn.commit()
