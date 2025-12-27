"""
voting.py

Helper utilities for turning Stage 2 rankings into numeric scores
that the chairman can use as weights.
"""

from collections import defaultdict
from typing import Dict, List, Tuple

# Type alias:
# rankings = {
#   "judge_model_name": ["candidate_model_1", "candidate_model_2", ...],
#   ...
# }

def compute_vote_scores(rankings: Dict[str, List[str]]) -> Dict[str, int]:
    """
    Given rankings from each judge, compute a total score for each model.

    Scoring rule:
      - If there are N models in a ranking, the top gets N points,
        second gets N-1, ..., last gets 1.
    """
    scores: Dict[str, int] = defaultdict(int)

    for judge, ordered_models in rankings.items():
        n = len(ordered_models)
        # position 0 (best) → n points, last → 1 point
        for position, model in enumerate(ordered_models):
            scores[model] += (n - position)

    return dict(scores)

def normalize_scores(scores: Dict[str, int]) -> Dict[str, float]:
    """
    Turn absolute scores into normalized weights that sum to 1.0.
    If all scores are zero (or dict is empty), returns zeros.
    """
    total = float(sum(scores.values()))
    if total <= 0:
        return {m: 0.0 for m in scores}
    return {m: s / total for m, s in scores.items()}

def sort_models_by_score(scores: Dict[str, int]) -> List[Tuple[str, int]]:
    """
    Convenience helper: return list of (model, score) sorted by score desc.
    """
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)
