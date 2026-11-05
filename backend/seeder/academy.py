import os
import sys
from typing import Any, Dict, List, Optional
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.connection import Base, engine, SessionLocal
from models.academy import (
    AcademyTag,
    AcademyResource,
    AcademyResourceType,
    AcademyGlossaryTerm,
    AcademyGlossaryTermType,
    AcademyModule,
    AcademyChapter,
    AcademyTagRelation,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = os.path.join(BASE_DIR, "source", "master")
sys.path.append(BASE_DIR)

TABLES_IN_REVERSE_ORDER = [
    "academy_tag_relation",
    "academy_user_chapter_progress",
    "academy_chapter",
    "academy_module",
    "academy_resource",
    "academy_glossary_term",
    "academy_tag",
]

# ============================================================
# 1. DEFAULT DATA: 10 TAGS
# ============================================================
DEFAULT_TAGS: List[Dict[str, Any]] = [
    {
        "id": 1,
        "name": "Income measurement",
        "slug": "income-measurement",
        "order_index": 1,
    },
    {
        "id": 2,
        "name": "Income gap",
        "slug": "income-gap",
        "order_index": 2,
    },
    {
        "id": 3,
        "name": "Benchmark",
        "slug": "benchmark",
        "order_index": 3,
    },
    {
        "id": 4,
        "name": "Due diligence",
        "slug": "due-diligence",
        "order_index": 4,
    },
    {
        "id": 5,
        "name": "Gender",
        "slug": "gender",
        "order_index": 5,
    },
    {
        "id": 6,
        "name": "Procurement",
        "slug": "procurement",
        "order_index": 6,
    },
    {
        "id": 7,
        "name": "Responsible pricing",
        "slug": "responsible-pricing",
        "order_index": 7,
    },
    {
        "id": 8,
        "name": "Diversification",
        "slug": "diversification",
        "order_index": 8,
    },
    {
        "id": 9,
        "name": "Farmer segmentation",
        "slug": "farmer-segmentation",
        "order_index": 9,
    },
    {
        "id": 10,
        "name": "Climate & resilience",
        "slug": "climate-resilience",
        "order_index": 10,
    },
]

# ============================================================
# 2. DEFAULT DATA: 9 TECHNICAL RESOURCES
# ============================================================
DEFAULT_RESOURCES: List[Dict[str, Any]] = [
    {
        "id": 1,
        "name": "IDH Living Income Roadmap Overview.pdf",
        "resource_type": AcademyResourceType.Guidance,
        "file_url": "/assets/academy/resources/idh_roadmap_overview.pdf",
    },
    {
        "id": 2,
        "name": "Income Measurement Guidance Tool.xlsx",
        "resource_type": AcademyResourceType.Tool,
        "file_url": "/assets/academy/resources/income_measurement_tool.xlsx",
    },
    {
        "id": 3,
        "name": "Global Living Wage Coalition Benchmark Database.url",
        "resource_type": AcademyResourceType.Organisation,
        "file_url": "https://www.globallivingwage.org",
    },
    {
        "id": 4,
        "name": "Farmer Household Survey Template.docx",
        "resource_type": AcademyResourceType.Template,
        "file_url": "/assets/academy/resources/household_survey_template.docx",
    },
    {
        "id": 5,
        "name": "Income Driver Calculator User Guide.pdf",
        "resource_type": AcademyResourceType.Guidance,
        "file_url": "/assets/academy/resources/idc_user_guide.pdf",
    },
    {
        "id": 6,
        "name": "Living Income Reference Price Estimation Model.xlsx",
        "resource_type": AcademyResourceType.Tool,
        "file_url": "/assets/academy/resources/lirp_estimation_model.xlsx",
    },
    {
        "id": 7,
        "name": "Cocoa & Coffee Farmer Segmentation Framework.pdf",
        "resource_type": AcademyResourceType.Guidance,
        "file_url": "/assets/academy/resources/farmer_segmentation.pdf",
    },
    {
        "id": 8,
        "name": "Sustainable Procurement Practices Assessment Checklist.xlsx",
        "resource_type": AcademyResourceType.Template,
        "file_url": "/assets/academy/resources/procurement_checklist.xlsx",
    },
    {
        "id": 9,
        "name": "Living Income Community of Practice Directory.url",
        "resource_type": AcademyResourceType.Organisation,
        "file_url": "https://www.livingincome.com",
    },
]

# ============================================================
# 3. DEFAULT DATA: 13 GLOSSARY TERMS
# ============================================================
DEFAULT_GLOSSARY_TERMS: List[Dict[str, Any]] = [
    {
        "id": 1,
        "name": "Living Income",
        "term_type": AcademyGlossaryTermType.Core,
        "definition": (
            "The net annual income required for a household in a particular "
            "place to afford a decent standard of living for all members of "
            "that household."
        ),
    },
    {
        "id": 2,
        "name": "Living Income Benchmark",
        "term_type": AcademyGlossaryTermType.Core,
        "definition": (
            "A credible, independent estimate of the net annual household "
            "income required to achieve a decent standard of living in a "
            "specific geographic area."
        ),
    },
    {
        "id": 3,
        "name": "Living Income Gap",
        "term_type": AcademyGlossaryTermType.Core,
        "definition": (
            "The difference between the living income benchmark and the "
            "actual net income currently earned by a smallholder farming "
            "household."
        ),
    },
    {
        "id": 4,
        "name": "Actual Household Income",
        "term_type": AcademyGlossaryTermType.Core,
        "definition": (
            "The total net revenue earned by all household members from "
            "farming operations, off-farm employment, remittances, and "
            "diversified business activities."
        ),
    },
    {
        "id": 5,
        "name": "Income Drivers",
        "term_type": AcademyGlossaryTermType.Core,
        "definition": (
            "The five fundamental economic levers determining farm income: "
            "production volume/yield, market price, farm size/land area, "
            "cost of production, and income diversification."
        ),
    },
    {
        "id": 6,
        "name": "Cost of Production",
        "term_type": AcademyGlossaryTermType.Finance,
        "definition": (
            "Total operational and capital expenditures incurred to produce a "
            "crop, including inputs, hired labor, machinery depreciation, "
            "and certification costs."
        ),
    },
    {
        "id": 7,
        "name": "Living Income Reference Price (LIRP)",
        "term_type": AcademyGlossaryTermType.Finance,
        "definition": (
            "The farm-gate price needed for a typical farm of viable size and "
            "productivity to earn a living income, assuming sustainable "
            "production practices."
        ),
    },
    {
        "id": 8,
        "name": "Return on Investment (ROI)",
        "term_type": AcademyGlossaryTermType.Finance,
        "definition": (
            "A metric comparing the financial and socioeconomic gains "
            "generated by a specific intervention against the capital "
            "invested."
        ),
    },
    {
        "id": 9,
        "name": "Farmer Cost Allocation",
        "term_type": AcademyGlossaryTermType.Finance,
        "definition": (
            "The distribution of shared program investments, input "
            "subsidies, or credit facilities across targeted farmer segments."
        ),
    },
    {
        "id": 10,
        "name": "Farmer Segmentation",
        "term_type": AcademyGlossaryTermType.Additional,
        "definition": (
            "Grouping smallholder farmers into distinct clusters based on "
            "farm size, asset endowment, yield potential, and dependency on "
            "the cash crop."
        ),
    },
    {
        "id": 11,
        "name": "Smart-Mix of Interventions",
        "term_type": AcademyGlossaryTermType.Additional,
        "definition": (
            "A tailored combination of procurement practices, technical "
            "assistance, productivity support, and price enhancements "
            "customized by segment."
        ),
    },
    {
        "id": 12,
        "name": "Anker Methodology",
        "term_type": AcademyGlossaryTermType.Additional,
        "definition": (
            "A widely accepted, rigorous methodology developed by Richard "
            "and Martha Anker to calculate living wage and living income "
            "benchmarks."
        ),
    },
    {
        "id": 13,
        "name": "Pre-Competitive Collaboration",
        "term_type": AcademyGlossaryTermType.Additional,
        "definition": (
            "Alliance between commercial competitors and stakeholders to "
            "address shared systemic challenges, such as living income gaps, "
            "without distorting market competition."
        ),
    },
]

# ============================================================
# 4. DEFAULT DATA: 6 MODULES
# ============================================================
DEFAULT_MODULES: List[Dict[str, Any]] = [
    {
        "id": 1,
        "order_index": 1,
        "title": "The Concept of Living Income",
        "description": (
            "Establish a solid foundation to act on living income, ensuring "
            "internal alignment and understanding in priority areas."
        ),
        "estimated_minutes": 16,
        "icon_theme": "blue",
    },
    {
        "id": 2,
        "order_index": 2,
        "title": "Measuring & Analysis",
        "description": (
            "Use recognised standards to identify credible living income "
            "benchmarks, calculate income gaps and assess verification options."
        ),
        "estimated_minutes": 20,
        "icon_theme": "green",
    },
    {
        "id": 3,
        "order_index": 3,
        "title": "Building the Business Case",
        "description": (
            "Align internal and external stakeholders on the value "
            "proposition and strategic priorities. Design your Living Income "
            "strategy and mobilise resources."
        ),
        "estimated_minutes": 18,
        "icon_theme": "pink",
    },
    {
        "id": 4,
        "order_index": 4,
        "title": "Implementing Solutions",
        "description": (
            "Take coordinated, targeted action to close the living income gap. "
            "Identify priority regions, commodities or household segments and "
            "determine a smart-mix of interventions to improve income drivers."
        ),
        "estimated_minutes": 25,
        "icon_theme": "purple",
    },
    {
        "id": 5,
        "order_index": 5,
        "title": "Reporting & Sharing Insights",
        "description": (
            "Build trust, knowledge, and demonstrate compliance through "
            "transparent reporting and shared learning that supports broader "
            "advocacy."
        ),
        "estimated_minutes": 15,
        "icon_theme": "cyan",
    },
    {
        "id": 6,
        "order_index": 6,
        "title": "Continuous Learning & Sector Collaboration",
        "description": (
            "Collaborate across pre-competitive coalitions, embed sustainable "
            "procurement practices, and drive continuous improvement."
        ),
        "estimated_minutes": 22,
        "icon_theme": "yellow",
    },
]


def _build_html_content(
    title: str,
    intro: str,
    context: str,
    bullet_items: List[str],
    takeaways: List[str],
) -> str:
    bullets_html = "".join(f"<li>{item}</li>" for item in bullet_items)
    takeaways_html = "".join(f"<li>{item}</li>" for item in takeaways)
    return (
        f"<h2>{title}</h2>"
        f"<p>{intro}</p>"
        f'<div class="callout-box"><strong>Key Context:</strong> {context}</div>'
        f"<ul>{bullets_html}</ul>"
        f'<div class="key-takeaways"><h3>Key Takeaways</h3>'
        f"<ul>{takeaways_html}</ul></div>"
    )


# ============================================================
# 5. DEFAULT DATA: 27 CHAPTERS
# ============================================================
DEFAULT_CHAPTERS: List[Dict[str, Any]] = [
    # Module 1 (Chapters 1 - 4)
    {
        "id": 1,
        "module_id": 1,
        "chapter_number": 1,
        "title": "Why Living Income Matters to Farmers and Companies",
        "content_html": _build_html_content(
            title="Why Living Income Matters to Farmers and Companies",
            intro=(
                "A living income is a human right and the cornerstone of "
                "sustainable agricultural supply chains. When farmers earn a "
                "decent livelihood, communities flourish and supply security "
                "is ensured."
            ),
            context=(
                "Poverty is the root cause of systemic issues including child "
                "labor, deforestation, and rural youth migration away from "
                "farming."
            ),
            bullet_items=[
                "Smallholder vulnerability directly threatens long-term supply",
                "Corporate reputational risk and mandatory ESG disclosures",
                "Economic empowerment enables farm investment and renewal",
            ],
            takeaways=[
                "Living income is essential for supply chain resilience.",
                "Root cause interventions outperform symptomatic aid.",
            ],
        ),
        "estimated_minutes": 5,
    },
    {
        "id": 2,
        "module_id": 1,
        "chapter_number": 2,
        "title": "Living Income vs Living Wage: Understanding the Distinction",
        "content_html": _build_html_content(
            title="Living Income vs Living Wage: Understanding the Distinction",
            intro=(
                "While living wage applies to hired formal or informal "
                "employees, living income applies to self-employed "
                "smallholder households."
            ),
            context=(
                "Smallholders bear production, climatic, and market price "
                "risks that salaried laborers do not directly shoulder."
            ),
            bullet_items=[
                "Living wage is tied to individual worker remuneration",
                "Living income calculates total net household earnings",
                "Smallholder costs of production must be deducted from revenue",
            ],
            takeaways=[
                "Never conflate wage per worker with net income per household.",
                "Accounting for cost of production is non-negotiable.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 3,
        "module_id": 1,
        "chapter_number": 3,
        "title": "Key Principles of the IDH Roadmap on Living Income",
        "content_html": _build_html_content(
            title="Key Principles of the IDH Roadmap on Living Income",
            intro=(
                "The IDH Roadmap provides a step-by-step pathway for "
                "companies to take concrete, measurable action on living income."
            ),
            context=(
                "Action must move beyond philanthropy to core commercial and "
                "procurement practices."
            ),
            bullet_items=[
                "Standardized measurement standards based on Anker methodology",
                "Smart-mix strategy tailored to diverse farmer segments",
                "Pre-competitive collaboration to share sector costs",
            ],
            takeaways=[
                "Follow a structured 5-to-6 stage roadmap for credible progress.",
                "Integrate living income into core purchasing practices.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 4,
        "module_id": 1,
        "chapter_number": 4,
        "title": "Setting Organizational Ambition and Scope",
        "content_html": _build_html_content(
            title="Setting Organizational Ambition and Scope",
            intro=(
                "Successful living income initiatives start with explicit "
                "leadership commitments, defined target origins, and clear "
                "timelines."
            ),
            context=(
                "Focusing on high-risk origins with high commodity dependency "
                "maximizes social impact."
            ),
            bullet_items=[
                "Defining baseline years and milestone targets (e.g., 2030)",
                "Securing cross-functional executive and commercial sponsorship",
                "Prioritizing origins using materiality and poverty data",
            ],
            takeaways=[
                "Establish clear time-bound corporate commitments.",
                "Engage commercial procurement early in the scoping phase.",
            ],
        ),
        "estimated_minutes": 3,
    },
    # Module 2 (Chapters 5 - 9)
    {
        "id": 5,
        "module_id": 2,
        "chapter_number": 1,
        "title": "Living Income Benchmarks and Anker Methodology",
        "content_html": _build_html_content(
            title="Living Income Benchmarks and Anker Methodology",
            intro=(
                "Credible benchmarks establish the local cost of a decent "
                "standard of living, including nutritious food, decent housing, "
                "education, healthcare, and an emergency buffer."
            ),
            context=(
                "The Anker Methodology is globally recognised as the gold "
                "standard for rigorous, independent benchmark studies."
            ),
            bullet_items=[
                "Cost of nutritious, culturally acceptable local diet",
                "Basic decent housing and essential amenities",
                "Non-food, non-housing expenses plus 5% unexpected margin",
            ],
            takeaways=[
                "Always use verified, independent living income benchmarks.",
                "Regularly adjust benchmarks for local inflation.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 6,
        "module_id": 2,
        "chapter_number": 2,
        "title": "Measuring Actual Household Income",
        "content_html": _build_html_content(
            title="Measuring Actual Household Income",
            intro=(
                "Actual household income measurement requires capturing total "
                "production, farm-gate prices, production costs, and off-farm "
                "income sources."
            ),
            context=(
                "Net household income = Gross farm revenues - Production costs "
                "+ Off-farm income + Remittances."
            ),
            bullet_items=[
                "Surveying cash crop volumes, rejected yields, and home use",
                "Auditing input costs, hired labor, and transport outlays",
                "Capturing secondary crops and household non-farm business",
            ],
            takeaways=[
                "Gross revenue is misleading; calculate net household earnings.",
                "Include diversified farm and non-farm revenue streams.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 7,
        "module_id": 2,
        "chapter_number": 3,
        "title": "Calculating and Visualizing the Living Income Gap",
        "content_html": _build_html_content(
            title="Calculating and Visualizing the Living Income Gap",
            intro=(
                "The living income gap is the absolute monetary deficit "
                "between actual net income and the regional living income "
                "benchmark."
            ),
            context=(
                "Visualizing the gap helps leadership grasp the scale of the "
                "challenge across sourcing origins."
            ),
            bullet_items=[
                "Absolute gap ($/year) and percentage shortfall calculations",
                "Distribution curves showing proportion of households below target",
                "Comparing income gaps across geographic origins and cooperatives",
            ],
            takeaways=[
                "Express gaps both in currency per year and as a percentage.",
                "Averages conceal acute vulnerability among the poorest tier.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 8,
        "module_id": 2,
        "chapter_number": 4,
        "title": "Farmer Segmentation and Household Economics",
        "content_html": _build_html_content(
            title="Farmer Segmentation and Household Economics",
            intro=(
                "Farmers are not uniform. Segmentation categorizes smallholders "
                "by land size, yield, asset access, and alternative income to "
                "enable targeted support."
            ),
            context=(
                "Treating smallholders as a homogeneous group results in "
                "inefficient blanket programs that miss the most vulnerable."
            ),
            bullet_items=[
                "Segmenting by viable land area and commercial potential",
                "Identifying subsistence vs commercialized producer tiers",
                "Assessing reliance on the target focus commodity",
            ],
            takeaways=[
                "One-size-fits-all programs fail smallholders.",
                "Differentiate interventions according to segment realities.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 9,
        "module_id": 2,
        "chapter_number": 5,
        "title": "Data Quality, Verification, and Ethical Sourcing",
        "content_html": _build_html_content(
            title="Data Quality, Verification, and Ethical Sourcing",
            intro=(
                "Robust data governance ensures smallholder data is gathered "
                "ethically, anonymized responsibly, and verified for high "
                "fidelity."
            ),
            context=(
                "Farmer consent, data privacy, and statistical confidence are "
                "essential for credible corporate reporting."
            ),
            bullet_items=[
                "Informed consent and transparent farmer benefit agreements",
                "Data cleaning, outlier removal, and statistical sampling",
                "Third-party audit and verification readiness",
            ],
            takeaways=[
                "Respect farmer data sovereignty and ethical consent.",
                "Rigorous data validation protects against reputational risk.",
            ],
        ),
        "estimated_minutes": 4,
    },
    # Module 3 (Chapters 10 - 13)
    {
        "id": 10,
        "module_id": 3,
        "chapter_number": 1,
        "title": "Developing the Internal Business Case",
        "content_html": _build_html_content(
            title="Developing the Internal Business Case",
            intro=(
                "Securing organizational buy-in requires framing living income "
                "not as a cost center, but as an investment in supply "
                "security and compliance."
            ),
            context=(
                "Aging farmer demographics and declining yields threaten future "
                "volume requirements."
            ),
            bullet_items=[
                "Linking farmer income to supply continuity and quality",
                "Mitigating regulatory risks under CSDDD and EUDR",
                "Demonstrating return on investment through farmer loyalty",
            ],
            takeaways=[
                "Position living income as core procurement risk mitigation.",
                "Quantify the costs of supply disruption versus intervention.",
            ],
        ),
        "estimated_minutes": 5,
    },
    {
        "id": 11,
        "module_id": 3,
        "chapter_number": 2,
        "title": "Stakeholder Mapping and Supply Chain Alignment",
        "content_html": _build_html_content(
            title="Stakeholder Mapping and Supply Chain Alignment",
            intro=(
                "Closing living income gaps requires coordinated action "
                "between traders, processors, retailers, governments, and "
                "producer organizations."
            ),
            context=(
                "No single company controls 100% of a farmer's crop; shared "
                "responsibility is essential."
            ),
            bullet_items=[
                "Mapping direct suppliers, tier-1 processors, and cooperatives",
                "Aligning incentive structures with local farmer organizations",
                "Engaging producer country government extension agencies",
            ],
            takeaways=[
                "Map all supply chain actors to avoid duplicative efforts.",
                "Involve local cooperatives as co-designers of solutions.",
            ],
        ),
        "estimated_minutes": 5,
    },
    {
        "id": 12,
        "module_id": 3,
        "chapter_number": 3,
        "title": "Resource Mobilization and Co-Investment Models",
        "content_html": _build_html_content(
            title="Resource Mobilization and Co-Investment Models",
            intro=(
                "Funding large-scale living income interventions involves "
                "blended finance, matching donor grants, and supply chain "
                "cost-sharing."
            ),
            context=(
                "Combining commercial capital with concessional finance "
                "lowers risk and accelerates program deployment."
            ),
            bullet_items=[
                "Blended finance structures with development finance institutions",
                "Supplier cost-sharing and volume-based premiums",
                "Public-private partnerships and matching funds",
            ],
            takeaways=[
                "Leverage co-investment to scale impact beyond CSR budgets.",
                "Structure shared-cost agreements across buyer coalitions.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 13,
        "module_id": 3,
        "chapter_number": 4,
        "title": "Integrating Living Income into Corporate Strategy",
        "content_html": _build_html_content(
            title="Integrating Living Income into Corporate Strategy",
            intro=(
                "Living income must be embedded into corporate KPIs, "
                "procurement scorecards, and board-level risk monitoring."
            ),
            context=(
                "When procurement buyers are rewarded solely on lowest purchase "
                "price, living income programs stall."
            ),
            bullet_items=[
                "Incorporating living income milestones into buyer performance goals",
                "Updating commercial contracts with multi-year sourcing commitments",
                "Establishing executive oversight committees for social sustainability",
            ],
            takeaways=[
                "Align buyer remuneration with living income outcomes.",
                "Make multi-year purchasing commitments to foster farmer confidence.",
            ],
        ),
        "estimated_minutes": 4,
    },
    # Module 4 (Chapters 14 - 19)
    {
        "id": 14,
        "module_id": 4,
        "chapter_number": 1,
        "title": "The Income Drivers Framework",
        "content_html": _build_html_content(
            title="The Income Drivers Framework",
            intro=(
                "Farmer net income is governed by five interdependent drivers: "
                "productivity/yield, effective price, farm area, cost of "
                "production, and income diversification."
            ),
            context=(
                "Interventions on a single driver often fail if countervailing "
                "drivers remain unaddressed."
            ),
            bullet_items=[
                "Productivity: sustainable yield per hectare without soil depletion",
                "Effective Price: farm-gate price, quality premiums, and LIRP",
                "Farm Size: cultivated land area and viable scale constraints",
                "Cost of Production: fertilizer, labor, transport, and finance costs",
                "Diversification: food crops, livestock, and non-agricultural revenue",
            ],
            takeaways=[
                "Analyze all five income drivers concurrently.",
                "Simulate scenario impacts before allocating field capital.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 15,
        "module_id": 4,
        "chapter_number": 2,
        "title": "Designing a Tailored Smart-Mix of Interventions",
        "content_html": _build_html_content(
            title="Designing a Tailored Smart-Mix of Interventions",
            intro=(
                "A smart-mix combines procurement practices, technical "
                "services, and financial tools customized for each farmer "
                "segment."
            ),
            context=(
                "Commercial farmers benefit most from input credit, while "
                "land-constrained farmers require diversification support."
            ),
            bullet_items=[
                "Matching interventions to segment-specific income constraints",
                "Sequencing activities: cash-flow stabilization before long-term inputs",
                "Balancing productivity gains with price incentives",
            ],
            takeaways=[
                "Deploy segment-specific smart-mix packages.",
                "Sequence short-term income support with systemic improvements.",
            ],
        ),
        "estimated_minutes": 5,
    },
    {
        "id": 16,
        "module_id": 4,
        "chapter_number": 3,
        "title": "Responsible Procurement Practices and Living Income Reference Prices",
        "content_html": _build_html_content(
            title="Responsible Procurement Practices and Living Income Reference Prices",
            intro=(
                "Responsible procurement means paying farm-gate prices that "
                "cover production costs and yield a living income for viable "
                "farms."
            ),
            context=(
                "A Living Income Reference Price (LIRP) serves as a benchmark "
                "price floor for sustainable trade."
            ),
            bullet_items=[
                "Calculating commodity-specific Living Income Reference Prices",
                "Implementing cash premiums delivered directly to farmers",
                "Adopting long-term contracts and transparent price discovery",
            ],
            takeaways=[
                "Higher price is often an indispensable lever for closing the gap.",
                "Ensure premiums reach farmers rather than intermediaries.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 17,
        "module_id": 4,
        "chapter_number": 4,
        "title": "Farmer Service Delivery and Input Financing",
        "content_html": _build_html_content(
            title="Farmer Service Delivery and Input Financing",
            intro=(
                "Affordable access to quality inputs, mechanization, and "
                "working capital unlocks productivity improvements."
            ),
            context=(
                "Smallholders without formal collateral face predatory informal "
                "interest rates that consume crop profits."
            ),
            bullet_items=[
                "Revolving input funds and digital micro-credit facilities",
                "Soil health management, seedling nurseries, and composting",
                "Cooperative machinery rings and shared processing assets",
            ],
            takeaways=[
                "Provide timely, affordable financing linked to harvest sales.",
                "Strengthen cooperative service delivery capacity.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 18,
        "module_id": 4,
        "chapter_number": 5,
        "title": "Crop and Non-Farm Income Diversification",
        "content_html": _build_html_content(
            title="Crop and Non-Farm Income Diversification",
            intro=(
                "Over-reliance on a single cash crop leaves households "
                "vulnerable to commodity price slumps and weather extremes."
            ),
            context=(
                "Food crop intercropping enhances household nutrition while "
                "smoothing seasonal cash flow."
            ),
            bullet_items=[
                "Agroforestry integration with shade trees and fruit crops",
                "Small livestock and off-season horticultural cash crops",
                "Vocational training for rural enterprise development",
            ],
            takeaways=[
                "Diversification cushions against commodity volatility.",
                "Support local market linkages for diversified crops.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 19,
        "module_id": 4,
        "chapter_number": 6,
        "title": "Enabling Environment: Land Tenure and Gender Inclusivity",
        "content_html": _build_html_content(
            title="Enabling Environment: Land Tenure and Gender Inclusivity",
            intro=(
                "Women perform a major share of farm labor yet frequently "
                "lack formal land title, cooperative voting rights, and crop "
                "payment access."
            ),
            context=(
                "Closing the gender gap in agricultural resource access "
                "significantly boosts farm productivity and child welfare."
            ),
            bullet_items=[
                "Joint household land documentation and tenure security",
                "Direct mobile payments to women farmers and co-managers",
                "Gender-transformative training for community leaders",
            ],
            takeaways=[
                "Gender equality directly accelerates living income achievement.",
                "Secure land rights encourage long-term farm stewardship.",
            ],
        ),
        "estimated_minutes": 4,
    },
    # Module 5 (Chapters 20 - 23)
    {
        "id": 20,
        "module_id": 5,
        "chapter_number": 1,
        "title": "Monitoring and Evaluating Living Income Progress",
        "content_html": _build_html_content(
            title="Monitoring and Evaluating Living Income Progress",
            intro=(
                "Continuous monitoring tracks whether interventions are "
                "closing the living income gap as intended."
            ),
            context=(
                "Annual sample surveys detect unintended trade-offs and enable "
                "adaptive program management."
            ),
            bullet_items=[
                "Standardized KPI dashboards tracking net income changes",
                "Control groups and quasi-experimental impact evaluation",
                "Feedback loops with participating farming communities",
            ],
            takeaways=[
                "Track progress against a defined baseline year.",
                "Use findings to adapt and optimize the smart-mix annually.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 21,
        "module_id": 5,
        "chapter_number": 2,
        "title": "Reporting Frameworks, CSRD, and Due Diligence Alignment",
        "content_html": _build_html_content(
            title="Reporting Frameworks, CSRD, and Due Diligence Alignment",
            intro=(
                "Emerging global regulations mandate transparent disclosure "
                "of supply chain human rights impacts, including living income."
            ),
            context=(
                "EU CSRD (ESRS S1 and S2) and CSDDD require auditable due "
                "diligence across agricultural value chains."
            ),
            bullet_items=[
                "Mapping living income metrics to ESRS disclosure standards",
                "Documenting human rights due diligence prevention steps",
                "Preparing audit trails for statutory non-financial reporting",
            ],
            takeaways=[
                "Align internal reporting with statutory ESG standards.",
                "Demonstrate proactive steps taken to address living income risks.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 22,
        "module_id": 5,
        "chapter_number": 3,
        "title": "Communicating Impact to Investors and Consumers",
        "content_html": _build_html_content(
            title="Communicating Impact to Investors and Consumers",
            intro=(
                "Transparent storytelling builds consumer loyalty and "
                "satisfies ESG investor scrutiny regarding fair value sharing."
            ),
            context=(
                "Avoid over-claiming; communicate realistic timelines and "
                "complex challenges honestly."
            ),
            bullet_items=[
                "Evidence-based impact narratives with verified farmer metrics",
                "On-pack storytelling linking purchases to living income premiums",
                "Responding to sustainability rating agencies (DJSI, CDP)",
            ],
            takeaways=[
                "Ground communications in rigorous data and verified outcomes.",
                "Emphasize transparency over superficial greenwashing.",
            ],
        ),
        "estimated_minutes": 4,
    },
    {
        "id": 23,
        "module_id": 5,
        "chapter_number": 4,
        "title": "Knowledge Sharing and Public Sector Advocacy",
        "content_html": _build_html_content(
            title="Knowledge Sharing and Public Sector Advocacy",
            intro=(
                "Industry transformation requires sharing operational lessons "
                "and engaging national governments on supportive policies."
            ),
            context=(
                "National policies on minimum farm-gate prices and social safety "
                "nets amplify corporate investments."
            ),
            bullet_items=[
                "Publishing open-source case studies and cost-benefit assessments",
                "Engaging producer government ministries on agricultural subsidies",
                "Supporting international living income advocacy platforms",
            ],
            takeaways=[
                "Share data openly to accelerate industry-wide learning.",
                "Collaborate with governments on systemic policy reforms.",
            ],
        ),
        "estimated_minutes": 3,
    },
    # Module 6 (Chapters 24 - 27)
    {
        "id": 24,
        "module_id": 6,
        "chapter_number": 1,
        "title": "Pre-Competitive Sector Collaboration and Platforms",
        "content_html": _build_html_content(
            title="Pre-Competitive Sector Collaboration and Platforms",
            intro=(
                "Individual corporate action cannot solve structural poverty "
                "alone. Pre-competitive alliances level the playing field."
            ),
            context=(
                "Platforms like DISCO, GISCO, and Beyond Chocolate unite "
                "retailers, brands, and civil society around common goals."
            ),
            bullet_items=[
                "Establishing shared origin living income targets and roadmaps",
                "Pooling investments in regional infrastructure and baseline surveys",
                "Antitrust compliance guidelines for sustainable purchasing pacts",
            ],
            takeaways=[
                "Join sector platforms to share financial and operational risk.",
                "Engage in collective advocacy for mandatory due diligence.",
            ],
        ),
        "estimated_minutes": 6,
    },
    {
        "id": 25,
        "module_id": 6,
        "chapter_number": 2,
        "title": "Cross-Commodity Lessons: Cocoa, Coffee, Tea, and Palm Oil",
        "content_html": _build_html_content(
            title="Cross-Commodity Lessons: Cocoa, Coffee, Tea, and Palm Oil",
            intro=(
                "While agronomic realities vary, smallholder poverty dynamics "
                "exhibit striking parallels across tropical cash crops."
            ),
            context=(
                "Coffee volatility, tea plantation wage dynamics, and cocoa "
                "farm size constraints offer valuable transferable insights."
            ),
            bullet_items=[
                "Lessons from Cocoa Living Income Differential (LID) policies",
                "Direct specialty sourcing and price floors in coffee",
                "Smallholder outgrower schemes in palm oil and tea estates",
            ],
            takeaways=[
                "Apply proven insights across adjacent commodity supply chains.",
                "Adapt interventions to commodity-specific production cycles.",
            ],
        ),
        "estimated_minutes": 6,
    },
    {
        "id": 26,
        "module_id": 6,
        "chapter_number": 3,
        "title": "Policy Harmonization and International Trade Guidelines",
        "content_html": _build_html_content(
            title="Policy Harmonization and International Trade Guidelines",
            intro=(
                "Global trade policies and multilateral frameworks provide "
                "instruments to support smallholder living incomes."
            ),
            context=(
                "OECD-FAO Guidance and UN Guiding Principles establish the "
                "standard for responsible business conduct."
            ),
            bullet_items=[
                "Integrating OECD-FAO guidance on agricultural supply chains",
                "Advocating for fair trade terms in bilateral trade pacts",
                "Harmonizing sustainability standards to reduce farmer audit fatigue",
            ],
            takeaways=[
                "Leverage international standards to legitimize corporate targets.",
                "Advocate for trade policies that reward fair farmer pricing.",
            ],
        ),
        "estimated_minutes": 5,
    },
    {
        "id": 27,
        "module_id": 6,
        "chapter_number": 4,
        "title": "Future Trends: Climate Resilience and Regenerative Agriculture",
        "content_html": _build_html_content(
            title="Future Trends: Climate Resilience and Regenerative Agriculture",
            intro=(
                "Climate breakdown disproportionately threatens smallholders. "
                "Regenerative agriculture must reward farmers for ecosystem "
                "services while improving income."
            ),
            context=(
                "Carbon credits and biodiversity payments represent emerging "
                "diversified revenue opportunities for smallholders."
            ),
            bullet_items=[
                "Monetizing smallholder carbon removal and soil organic matter",
                "Payments for Ecosystem Services (PES) and watershed stewardship",
                "Drought-tolerant varieties and weather-index crop insurance",
            ],
            takeaways=[
                "Align living income programs with climate resilience efforts.",
                "Ensure carbon finance flows directly to smallholder households.",
            ],
        ),
        "estimated_minutes": 5,
    },
]

# ============================================================
# 6. DEFAULT DATA: 35 TAG RELATIONS (14 MODULES + 21 CHAPTERS)
# ============================================================
DEFAULT_TAG_RELATIONS: List[Dict[str, Any]] = [
    # Module Tag Relations (14 relations)
    {"id": 1, "tag_id": 1, "module_id": 1, "chapter_id": None},
    {"id": 2, "tag_id": 2, "module_id": 1, "chapter_id": None},
    {"id": 3, "tag_id": 1, "module_id": 2, "chapter_id": None},
    {"id": 4, "tag_id": 3, "module_id": 2, "chapter_id": None},
    {"id": 5, "tag_id": 9, "module_id": 2, "chapter_id": None},
    {"id": 6, "tag_id": 4, "module_id": 3, "chapter_id": None},
    {"id": 7, "tag_id": 6, "module_id": 3, "chapter_id": None},
    {"id": 8, "tag_id": 6, "module_id": 4, "chapter_id": None},
    {"id": 9, "tag_id": 7, "module_id": 4, "chapter_id": None},
    {"id": 10, "tag_id": 8, "module_id": 4, "chapter_id": None},
    {"id": 11, "tag_id": 2, "module_id": 5, "chapter_id": None},
    {"id": 12, "tag_id": 4, "module_id": 5, "chapter_id": None},
    {"id": 13, "tag_id": 6, "module_id": 6, "chapter_id": None},
    {"id": 14, "tag_id": 10, "module_id": 6, "chapter_id": None},
    # Chapter Tag Relations (21 relations)
    {"id": 15, "tag_id": 1, "module_id": None, "chapter_id": 1},
    {"id": 16, "tag_id": 1, "module_id": None, "chapter_id": 2},
    {"id": 17, "tag_id": 4, "module_id": None, "chapter_id": 3},
    {"id": 18, "tag_id": 4, "module_id": None, "chapter_id": 4},
    {"id": 19, "tag_id": 3, "module_id": None, "chapter_id": 5},
    {"id": 20, "tag_id": 1, "module_id": None, "chapter_id": 6},
    {"id": 21, "tag_id": 2, "module_id": None, "chapter_id": 7},
    {"id": 22, "tag_id": 9, "module_id": None, "chapter_id": 8},
    {"id": 23, "tag_id": 4, "module_id": None, "chapter_id": 9},
    {"id": 24, "tag_id": 6, "module_id": None, "chapter_id": 10},
    {"id": 25, "tag_id": 4, "module_id": None, "chapter_id": 11},
    {"id": 26, "tag_id": 1, "module_id": None, "chapter_id": 14},
    {"id": 27, "tag_id": 9, "module_id": None, "chapter_id": 15},
    {"id": 28, "tag_id": 7, "module_id": None, "chapter_id": 16},
    {"id": 29, "tag_id": 6, "module_id": None, "chapter_id": 17},
    {"id": 30, "tag_id": 8, "module_id": None, "chapter_id": 18},
    {"id": 31, "tag_id": 5, "module_id": None, "chapter_id": 19},
    {"id": 32, "tag_id": 4, "module_id": None, "chapter_id": 21},
    {"id": 33, "tag_id": 6, "module_id": None, "chapter_id": 24},
    {"id": 34, "tag_id": 8, "module_id": None, "chapter_id": 25},
    {"id": 35, "tag_id": 10, "module_id": None, "chapter_id": 27},
]


# ============================================================
# HELPER FUNCTIONS & SEEDING LOGIC
# ============================================================
def truncate_academy_tables(session: Session) -> None:
    """Topological truncation in reverse dependency order and sequence reset."""
    session.commit()
    for table in TABLES_IN_REVERSE_ORDER:
        session.execute(text(f'TRUNCATE TABLE "{table}" CASCADE;'))
        try:
            session.execute(
                text(f"ALTER SEQUENCE {table}_id_seq RESTART WITH 1;")
            )
        except Exception:
            pass
    session.commit()


def sync_table_sequence(session: Session, table: str) -> None:
    """Synchronize table autoincrement sequence with maximum ID."""
    try:
        session.execute(
            text(
                f"SELECT setval('{table}_id_seq', "
                f'(SELECT COALESCE(MAX(id), 1) FROM "{table}"));'
            )
        )
        session.commit()
    except Exception:
        pass


def load_csv(file_name: str) -> Optional[pd.DataFrame]:
    """Check if CSV exists in MASTER_DIR and is non-empty."""
    file_path = os.path.join(MASTER_DIR, file_name)
    if not os.path.exists(file_path):
        return None
    try:
        df = pd.read_csv(file_path)
        if df.empty:
            return None
        return df
    except Exception:
        return None


def seed_tags(session: Session) -> None:
    df = load_csv("academy_tags.csv")
    tags_to_insert = (
        df.to_dict(orient="records") if df is not None else DEFAULT_TAGS
    )

    for item in tags_to_insert:
        tag = AcademyTag(
            id=int(item["id"]) if "id" in item and pd.notna(item["id"]) else None,
            name=str(item["name"]),
            slug=str(item["slug"]),
            order_index=int(item.get("order_index", 0)),
        )
        session.add(tag)
    session.commit()
    sync_table_sequence(session, "academy_tag")
    print(f"[OK] Seeded {len(tags_to_insert)} academy tags.")


def seed_resources(session: Session) -> None:
    df = load_csv("academy_resources.csv")
    resources_to_insert = (
        df.to_dict(orient="records") if df is not None else DEFAULT_RESOURCES
    )

    for item in resources_to_insert:
        res_type_raw = item["resource_type"]
        res_type = (
            res_type_raw
            if isinstance(res_type_raw, AcademyResourceType)
            else AcademyResourceType(str(res_type_raw))
        )
        resource = AcademyResource(
            id=int(item["id"]) if "id" in item and pd.notna(item["id"]) else None,
            name=str(item["name"]),
            resource_type=res_type,
            file_url=str(item["file_url"]),
        )
        session.add(resource)
    session.commit()
    sync_table_sequence(session, "academy_resource")
    print(f"[OK] Seeded {len(resources_to_insert)} academy resources.")


def seed_glossary_terms(session: Session) -> None:
    df = load_csv("academy_glossary.csv")
    terms_to_insert = (
        df.to_dict(orient="records")
        if df is not None
        else DEFAULT_GLOSSARY_TERMS
    )

    for item in terms_to_insert:
        term_type_raw = item["term_type"]
        term_type = (
            term_type_raw
            if isinstance(term_type_raw, AcademyGlossaryTermType)
            else AcademyGlossaryTermType(str(term_type_raw))
        )
        glossary_term = AcademyGlossaryTerm(
            id=int(item["id"]) if "id" in item and pd.notna(item["id"]) else None,
            name=str(item["name"]),
            term_type=term_type,
            definition=str(item["definition"]),
        )
        session.add(glossary_term)
    session.commit()
    sync_table_sequence(session, "academy_glossary_term")
    print(f"[OK] Seeded {len(terms_to_insert)} academy glossary terms.")


def seed_modules(session: Session) -> None:
    df = load_csv("academy_modules.csv")
    modules_to_insert = (
        df.to_dict(orient="records") if df is not None else DEFAULT_MODULES
    )

    for item in modules_to_insert:
        module = AcademyModule(
            id=int(item["id"]) if "id" in item and pd.notna(item["id"]) else None,
            order_index=int(item["order_index"]),
            title=str(item["title"]),
            description=(
                str(item["description"])
                if pd.notna(item.get("description"))
                else None
            ),
            estimated_minutes=int(item.get("estimated_minutes", 16)),
            icon_theme=(
                str(item["icon_theme"])
                if pd.notna(item.get("icon_theme"))
                else None
            ),
        )
        session.add(module)
    session.commit()
    sync_table_sequence(session, "academy_module")
    print(f"[OK] Seeded {len(modules_to_insert)} academy modules.")


def seed_chapters(session: Session) -> None:
    df = load_csv("academy_chapters.csv")
    chapters_to_insert = (
        df.to_dict(orient="records") if df is not None else DEFAULT_CHAPTERS
    )

    for item in chapters_to_insert:
        chapter = AcademyChapter(
            id=int(item["id"]) if "id" in item and pd.notna(item["id"]) else None,
            module_id=int(item["module_id"]),
            chapter_number=int(item["chapter_number"]),
            title=str(item["title"]),
            content_html=(
                str(item["content_html"])
                if pd.notna(item.get("content_html"))
                else None
            ),
            estimated_minutes=int(item.get("estimated_minutes", 5)),
        )
        session.add(chapter)
    session.commit()
    sync_table_sequence(session, "academy_chapter")
    print(f"[OK] Seeded {len(chapters_to_insert)} academy chapters.")


def seed_tag_relations(session: Session) -> None:
    df = load_csv("academy_tag_relations.csv")
    relations_to_insert = (
        df.to_dict(orient="records")
        if df is not None
        else DEFAULT_TAG_RELATIONS
    )

    for item in relations_to_insert:
        mod_id = (
            int(item["module_id"])
            if pd.notna(item.get("module_id")) and item.get("module_id") is not None
            else None
        )
        ch_id = (
            int(item["chapter_id"])
            if pd.notna(item.get("chapter_id")) and item.get("chapter_id") is not None
            else None
        )
        relation = AcademyTagRelation(
            id=int(item["id"]) if "id" in item and pd.notna(item["id"]) else None,
            tag_id=int(item["tag_id"]),
            module_id=mod_id,
            chapter_id=ch_id,
        )
        session.add(relation)
    session.commit()
    sync_table_sequence(session, "academy_tag_relation")
    print(f"[OK] Seeded {len(relations_to_insert)} academy tag relations.")


def seed_academy(session: Session) -> None:
    print("[INFO] Starting Academy Seeder...")
    truncate_academy_tables(session)
    seed_tags(session)
    seed_resources(session)
    seed_glossary_terms(session)
    seed_modules(session)
    seed_chapters(session)
    seed_tag_relations(session)
    print("[DONE] Academy Seeder completed successfully.")


def run() -> None:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        seed_academy(session=session)
    finally:
        session.close()


if __name__ == "__main__":
    run()
