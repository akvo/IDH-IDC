# IMPORTANT: import all models here
from models.user import User  # noqa
from models.user_profile import UserProfile  # noqa
from models.academy import (  # noqa
    AcademyTag,
    AcademyResource,
    AcademyGlossaryTerm,
    AcademyModule,
    AcademyChapter,
    AcademyTagRelation,
    AcademyUserChapterProgress,
)
from models.question import Question  # noqa
from models.company import Company  # noqa
from models.commodity_category import CommodityCategory  # noqa
from models.commodity_category_question import (  # noqa
    CommodityCategoryQuestion,
)
from models.case import Case  # noqa
from models.case_import import CaseImport  # noqa

# add all other models
