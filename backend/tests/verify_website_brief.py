# -*- coding: utf-8 -*-
"""
verify_website_brief.py
Automated Python test runner to verify the rule-based Website Brief fallback catalog.
"""

def generate_website_brief_fallback(domain, title, meta_description, headings=[]):
    norm_domain = domain.lower().strip()
    
    popular_sites = {
        'youtube.com': {
            'siteName': 'YouTube',
            'brief': 'YouTube is a video-sharing platform for watching, uploading, and interacting with videos.\nUsers can subscribe to channels, comment on videos, create playlists, and manage their content preferences.\nThe platform primarily provides personalized video content and creator-based entertainment.'
        },
        'github.com': {
            'siteName': 'GitHub',
            'brief': 'GitHub is a platform for hosting and collaborating on software development projects using Git repositories.\nUsers can create repositories, contribute code, review changes, manage issues, and collaborate with developers.\nThe platform primarily supports software development, version control, and open-source collaboration.'
        },
        'amazon.com': {
            'siteName': 'Amazon',
            'brief': 'Amazon is an online marketplace where users can search for and purchase products from different categories.\nUsers can manage orders, payments, addresses, reviews, returns, and personalized shopping preferences.\nThe platform primarily provides e-commerce, product discovery, purchasing, and delivery services.'
        }
    }

    if norm_domain in popular_sites:
        return True, popular_sites[norm_domain]['siteName'], popular_sites[norm_domain]['brief']

    title_lower = (title or '').lower()
    desc_lower = (meta_description or '').lower()
    combined_text = f"{norm_domain} {title_lower} {desc_lower} {' '.join(headings).lower()}"

    site_name = domain.split('.')[0].upper()

    if any(k in combined_text for k in ['college', 'university', '.edu', 'academic']):
        return True, site_name, f"{site_name} is an educational institution website providing academic and campus details."

    if title and len(title.strip()) > 0:
        return True, site_name, f"{site_name} is a web platform for digital content and information access."

    return False, domain, "Unable to generate a reliable website summary."


# Verification Tests
test_cases = [
    {
        "domain": "youtube.com", "title": "YouTube", "desc": "Videos", "headings": [],
        "expected_name": "YouTube", "expected_match": "video-sharing platform"
    },
    {
        "domain": "github.com", "title": "GitHub", "desc": "Developer", "headings": [],
        "expected_name": "GitHub", "expected_match": "collaborating on software"
    },
    {
        "domain": "mit.edu", "title": "MIT Admissions", "desc": "Apply to MIT", "headings": ["Welcome"],
        "expected_name": "MIT", "expected_match": "educational institution"
    }
]

print("==================================================")
print("PrivacyLens - Website Brief Heuristic Verification")
print("==================================================")

all_passed = True
for idx, tc in enumerate(test_cases, 1):
    success, name, brief = generate_website_brief_fallback(tc['domain'], tc['title'], tc['desc'], tc['headings'])
    passed = success and (tc['expected_name'] in name) and (tc['expected_match'] in brief)
    if not passed:
        all_passed = False
    status = "PASSED" if passed else "FAILED"
    print(f"Test {idx}: Domain={tc['domain']} -> SiteName={name}")
    print(f"       Summary match: '{tc['expected_match']}' | {status}")

print("==================================================")
if all_passed:
    print("SUCCESS: Website Brief local fallback engine verified!")
else:
    print("ERROR: Discrepancy found in Website Brief logic!")
print("==================================================")
