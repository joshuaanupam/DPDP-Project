import json
import urllib.request
import urllib.parse
import sys

# Force UTF-8 stdout encoding for Windows console
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:5000/api/ai/website-summary"

def post_summary(domain, language="EN", site_name=None, page_title=None, meta_description=None):
    payload = {
        "domain": domain,
        "language": language
    }
    if site_name:
        payload["websiteName"] = site_name
    if page_title:
        payload["pageTitle"] = page_title
    if meta_description:
        payload["metaDescription"] = meta_description

    req = urllib.request.Request(
        BASE_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"Error calling {BASE_URL}: {e}")
        return None

def test_unified_system():
    print("==================================================")
    print("[TEST] PRIVACYLENS UNIFIED AI SUMMARY VERIFICATION")
    print("==================================================")

    # ----------------------------------------------------
    # TEST 1: GitHub vs Wikipedia domain keying
    # ----------------------------------------------------
    print("\n[TEST 1] Fetching GitHub summary...")
    github_res = post_summary("https://github.com/user/repo", "EN", "GitHub")
    assert github_res is not None and github_res["success"], "GitHub summary request failed"
    assert github_res["websiteId"] == "github.com", f"Expected github.com, got {github_res['websiteId']}"
    assert "Git" in github_res["bullets"][0] or "repositories" in github_res["bullets"][0], "GitHub summary wrong"
    print(f"SUCCESS: GitHub Summary Verified ({github_res['websiteId']}):")
    for b in github_res["bullets"]:
        print(f"   {b}")

    print("\n[TEST 2] Fetching Wikipedia summary...")
    wiki_res = post_summary("https://www.wikipedia.org/wiki/Main_Page", "EN", "Wikipedia")
    assert wiki_res is not None and wiki_res["success"], "Wikipedia summary request failed"
    assert wiki_res["websiteId"] == "wikipedia.org", f"Expected wikipedia.org, got {wiki_res['websiteId']}"
    assert "encyclopedia" in wiki_res["bullets"][0].lower(), "Wikipedia summary wrong"
    print(f"SUCCESS: Wikipedia Summary Verified ({wiki_res['websiteId']}):")
    for b in wiki_res["bullets"]:
        print(f"   {b}")

    # Verify no cross contamination
    assert wiki_res["websiteId"] != github_res["websiteId"]
    assert "Git" not in wiki_res["bullets"][0]

    # ----------------------------------------------------
    # TEST 3: Multilingual Consistency (EN, HI, TE)
    # ----------------------------------------------------
    print("\n[TEST 3] Verifying Multilingual Consistency (EN / HI / TE)...")
    wiki_hi = post_summary("wikipedia.org", "HI", "Wikipedia")
    wiki_te = post_summary("wikipedia.org", "TE", "Wikipedia")

    assert wiki_hi["bullets"][0] != wiki_res["bullets"][0], "Hindi text should be in Hindi script"
    assert wiki_te["bullets"][0] != wiki_res["bullets"][0], "Telugu text should be in Telugu script"

    print("English:")
    print(f"   {wiki_res['bullets'][0]}")
    print("Hindi:")
    print(f"   {wiki_hi['bullets'][0]}")
    print("Telugu:")
    print(f"   {wiki_te['bullets'][0]}")

    # ----------------------------------------------------
    # TEST 4: Unknown Website -> Strict Factual Mode (No Guessing!)
    # ----------------------------------------------------
    print("\n[TEST 4] Testing Unknown Website (No Hallucinated/Guessed Category)...")
    unknown_res = post_summary("xyz-unknown-gaming-random-site.net", "EN")
    print(f"   Response websiteId: {unknown_res['websiteId']}")
    print(f"   Response Bullets: {unknown_res['bullets']}")
    
    # Must NOT say "This is an online shopping platform" or "This is a gaming website"
    bullets_text = " ".join(unknown_res['bullets']).lower()
    assert "online shopping platform" not in bullets_text, "ERROR: Generic category template generated!"
    assert "verified website information unavailable" in bullets_text or unknown_res["success"] == False, "Expected unavailable message for unknown site"
    print("SUCCESS: Unknown website strictly returned unavailable message without guessing!")

    # ----------------------------------------------------
    # TEST 5: Tracked E-Commerce vs Gaming (Epic Games Store)
    # ----------------------------------------------------
    print("\n[TEST 5] Testing Epic Games Store (Gaming Storefront)...")
    epic_res = post_summary("store.epicgames.com", "EN", "Epic Games Store")
    assert epic_res["websiteId"] == "store.epicgames.com"
    assert "epic games store" in epic_res["bullets"][0].lower()
    print("SUCCESS: Epic Games Store Gaming Summary Verified:")
    for b in epic_res["bullets"]:
        print(f"   {b}")

    print("\n[TEST 6] Testing ShopEase (E-Commerce)...")
    shop_res = post_summary("shopease.com", "EN", "ShopEase")
    assert shop_res["websiteId"] == "shopease.com"
    assert "shopease" in shop_res["bullets"][0].lower() or "e-commerce" in shop_res["bullets"][0].lower()
    print("SUCCESS: ShopEase E-Commerce Summary Verified:")
    for b in shop_res["bullets"]:
        print(f"   {b}")

    print("\n==================================================")
    print("ALL 7 TEST REQUIREMENTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_unified_system()
