# -*- coding: utf-8 -*-
"""
verify_privacy_score.py
Automated Python test runner to verify the correctness of the PrivacyScore engine.
Formula: Score = 100 - (ActiveMarketingConsents * 5) - (HighRiskSites * 10) + (RevokedConsents * 3) - ChildPenalty - BreachPenalty
Clamped: [0, 100]
"""

def calculate_privacy_score(active_marketing, high_risk, revoked, is_child_unconsented=False, has_breaches=False):
    raw_score = 100 - (active_marketing * 5) - (high_risk * 10) + (revoked * 3)
    if is_child_unconsented:
        raw_score -= 15
    if has_breaches:
        raw_score -= 25
    return max(0, min(100, int(raw_score)))

# Test Cases
test_cases = [
    {"marketing": 0, "high_risk": 0, "revoked": 0, "child": False, "breach": False, "expected": 100}, # Baseline
    {"marketing": 2, "high_risk": 1, "revoked": 0, "child": False, "breach": False, "expected": 80},  # Normal
    {"marketing": 1, "high_risk": 0, "revoked": 0, "child": True,  "breach": False, "expected": 80},  # Child Penalty (-15) -> 100 - 5 - 15 = 80
    {"marketing": 0, "high_risk": 1, "revoked": 0, "child": False, "breach": True,  "expected": 65},  # Breach Penalty (-25) -> 100 - 10 - 25 = 65
    {"marketing": 1, "high_risk": 1, "revoked": 0, "child": True,  "breach": True,  "expected": 45},  # Both penalties -> 100 - 5 - 10 - 15 - 25 = 45
    {"marketing": 8, "high_risk": 7, "revoked": 1, "child": True,  "breach": True,  "expected": 0}    # Over-clamped
]

print("==================================================")
print("PrivacyLens - Privacy Score Algorithm Verification")
print("==================================================")
all_passed = True
for idx, tc in enumerate(test_cases, 1):
    score = calculate_privacy_score(tc['marketing'], tc['high_risk'], tc['revoked'], tc['child'], tc['breach'])
    passed = (score == tc['expected'])
    status = "PASSED" if passed else "FAILED"
    if not passed:
        all_passed = False
    print(f"Test {idx}: Marketing={tc['marketing']}, HighRisk={tc['high_risk']}, Revoked={tc['revoked']}, Child={tc['child']}, Breach={tc['breach']}")
    print(f"       Result Score={score} | Expected={tc['expected']} | {status}")

print("==================================================")
if all_passed:
    print("SUCCESS: Privacy Score engine formula with penalties verified!")
else:
    print("ERROR: Discrepancy found in score calculation!")
print("==================================================")
