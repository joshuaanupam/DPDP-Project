# -*- coding: utf-8 -*-
"""
verify_privacy_score.py
Automated Python test runner to verify the correctness of the PrivacyScore engine.
Formula: Score = 100 - (ActiveMarketingConsents * 5) - (HighRiskSites * 10) + (RevokedConsents * 3)
Clamped: [0, 100]
"""

def calculate_privacy_score(active_marketing, high_risk, revoked):
    raw_score = 100 - (active_marketing * 5) - (high_risk * 10) + (revoked * 3)
    return max(0, min(100, int(raw_score)))

def get_score_band(score):
    if score >= 85:
        return 'Excellent (Protected)'
    elif score >= 70:
        return 'Good (Low Risk)'
    elif score >= 50:
        return 'Fair (Attention Needed)'
    return 'High Risk (Critical Exposure)'

# Test Cases
test_cases = [
    {"marketing": 0, "high_risk": 0, "revoked": 0, "expected": 100}, # Baseline
    {"marketing": 2, "high_risk": 1, "revoked": 0, "expected": 80},  # Moderate risk (100 - 10 - 10 = 80)
    {"marketing": 4, "high_risk": 2, "revoked": 0, "expected": 60},  # Warning risk (100 - 20 - 20 = 60)
    {"marketing": 1, "high_risk": 0, "revoked": 5, "expected": 100}, # High rewards (100 - 5 + 15 = 110 -> 100)
    {"marketing": 8, "high_risk": 7, "revoked": 1, "expected": 0},   # Excessive risk (100 - 40 - 70 + 3 = -7 -> 0)
    {"marketing": 3, "high_risk": 1, "revoked": 2, "expected": 81}   # Mixed (100 - 15 - 10 + 6 = 81)
]

print("==================================================")
print("PrivacyLens - Privacy Score Algorithm Verification")
print("==================================================")
all_passed = True
for idx, tc in enumerate(test_cases, 1):
    score = calculate_privacy_score(tc['marketing'], tc['high_risk'], tc['revoked'])
    band = get_score_band(score)
    passed = (score == tc['expected'])
    status = "PASSED" if passed else "FAILED"
    if not passed:
        all_passed = False
    print(f"Test {idx}: Marketing={tc['marketing']}, HighRisk={tc['high_risk']}, Revoked={tc['revoked']}")
    print(f"       Result Score={score} ({band}) | Expected={tc['expected']} | {status}")

print("==================================================")
if all_passed:
    print("SUCCESS: Privacy Score engine formula verified!")
else:
    print("ERROR: Discrepancy found in score calculation!")
print("==================================================")
