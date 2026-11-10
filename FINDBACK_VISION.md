# FindBack Vision

FindBack now supports hybrid lost-and-found matching:

- 65% of the final score comes from the existing text signals.
- 35% comes from visual similarity when both reports have an image fingerprint.
- If an image or the optional vision packages are unavailable, FindBack safely
  uses the original text score only.

## First run

From the project folder with the virtual environment activated:

```powershell
python -m pip install -r requirements-vision.txt
uvicorn main:app --reload
```

Open `http://127.0.0.1:8000/vision/status`. The first uploaded image may take
longer because the local CLIP model is downloaded and cached once.

## Existing images

Sign in as the admin in Swagger, then run:

```text
POST /admin/vision/rebuild
```

Only files stored under `/uploads/` can be fingerprinted. Decorative frontend
assets are intentionally ignored.

## Match response

`GET /reports/{report_id}/matches` keeps the existing `match_score` and adds:

- `text_score`
- `visual_score` (or `null` when image comparison is unavailable)
- `match_method`: `text` or `hybrid`
- `match_reasons`: stable reason codes that the Arabic/English interface can
  translate without hard-coded API sentences.
