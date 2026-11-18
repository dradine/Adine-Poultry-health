# بررسی تطبیقی شرکت‌ها، نرم‌افزارها و قابلیت‌های سرولوژی طیور — ۱۸ نوامبر ۲۰۲۶

## خلاصه اجرایی
این بررسی، اسناد رسمی BioChek، IDEXX، Innovative Diagnostics/IDvet، Biogal و WOAH را بررسی می‌کند. نتیجه مهم: IDvet یک منبع بسیار ارزشمند برای توسعه موتورهای بیماری‌محور است؛ زیرا ID Soft به‌طور رسمی تیتراسیون، سن واکسیناسیون و baseline را برای پیشگیری طیور پشتیبانی می‌کند و ورود داده از reader، Excel و ورود دستی را دارد. IDvet همچنین کیت‌های متمایز برای IBD معمولی و IBD-VP2 نوترکیب، Influenza NP و H5، ND و IBV و ابزارهای مرجع/کنترل دارد. با این حال نباید ادعا کنیم ID Soft یا فرمت فایل‌های آن مستقیماً با برنامه ما یکپارچه است؛ باید قالب واقعی خروجی و نسخه نرم‌افزار را دریافت و تست کنیم.

## 1) BioChek
### آنچه رسماً مستند است
- BioChek II: آنلاین/Cloud database، مدیریت ELISA و PCR، گزارش‌های متعدد، Farm Histogram، Trend report، Control Tracking.
- Barcode sample forms: فرم نمونه‌گیری بارکددار برای جلوگیری از ورود مجدد اطلاعات ثابت گله/مزرعه.
- LIMS interface: امکان اتصال به LIMS.
- PCR: workflow و تحلیل PCR، ارتباط با thermocyclerهای رایج و گزارش‌های ELISA/PCR در یک محیط.
- Reference controls برای ELISA و PCR standards؛ تجهیزات automation مانند BEAR.
منابع: https://www.biochek.com/software/ ; https://www.biochek.com/poultry/ ; https://www.biochek.com/poultry/poultry-pcr/
### قابلیت‌هایی که باید اقتباس شوند
1. بارکد/QR برای Sample ID و برگه نمونه‌گیری؛ کد شامل شناسه opaque باشد، نه اطلاعات حساس قابل خواندن.
2. یک نمای چندنتیجه‌ای برای پرنده/گله، trend در طول زمان، histogram و QC-control tracking.
3. ثبت داده‌های PCR و ELISA در پرونده گله با حفظ تفاوت روش‌ها و واحدها؛ نه ترکیب عددی.
4. معماری Adapter برای LIMS و دستگاه‌ها؛ اما import اول از CSV/XLSX عمومی و سپس adapterهای اختصاصی.
5. Control chart و lot/run traceability.
### احتیاط
عبارت Automated Validated به محصول BioChek اشاره دارد؛ نباید به معنی validation خودکار نتایج در برنامه ما تفسیر شود.

## 2) IDEXX
### xChekPlus و xChek Lab / xChek Vet
- xChekPlus: خواندن/تفسیر ELISA، تحلیل، گزارش و مدیریت داده.
- xChek Lab: چندکاربره، customization گونه و assay، LIMS integration، import/export، workflow و database مرکزی.
- xChek Vet: ابزار ابری برای تجمیع نتایج چند آزمایشگاه، اشتراک داده و همکاری/روندهای سازمانی.
منابع: https://www.idexx.com/en/livestock/xchekplus-software/ ; https://www.idexx.com/en/livestock/xcheklab-software/
### اقتباس پیشنهادی
1. جداسازی نقش‌ها: data entry/lab operator، veterinarian/reviewer، admin.
2. امکان تعریف assay و species-specific templates، بدون hard-code کردن محاسبات.
3. Multi-lab data harmonization فقط در سطح raw/metadata و پس از تأیید هم‌ارزی؛ نه تبدیل خودکار titreها.
4. Centralized result database، import/export و audit trail.
5. یک پرونده چندآزمایشگاهی برای گله که نتایج مختلف را در timeline نشان دهد.
### احتیاط
ادعای IDEXX درباره یکپارچه‌سازی چند آزمایشگاه و «حذف تبدیل دستی» ویژگی پلتفرم خودشان است؛ ما باید استاندارد داخلی داده تعریف کنیم و با نمونه فایل واقعی هر آزمایشگاه validate کنیم.

## 3) Innovative Diagnostics / IDvet
### ID Soft
بروشور رسمی ID Soft می‌گوید:
- تحلیل داده برای ID Screen ELISA؛ چندگونه از جمله avian.
- برای طیور: محاسبه titres، vaccination age و baseline values.
- ورود OD از reader، import از Excel یا ورود دستی.
- خروجی OD به Excel/XML.
- چند workstation، template/report قابل تنظیم.
منبع: https://www.innovative-diagnostics.com/wp-content/uploads/2022/11/Brochure-IDSOFT_0922_EN_doc13851.pdf
صفحه avian رسمی: https://www.innovative-diagnostics.com/espece/avian/
### نکته علمی مهم: مدل‌های مجزا
- ID Screen IBD Indirect (IBDS): برای پایش واکسن‌های conventional/live/killed و Deventer Log2، شامل توزیع همگن/ناهمگن و single/double prediction طبق بروشور IBD.
- ID Screen IBD VP2 (IBDVP2): سنجش آنتی‌بادی ضد VP2 و طراحی‌شده برای پرندگان دریافت‌کننده واکسن‌های recombinant VP2 vector؛ نباید از مدل IBDS/Deventer conventional برای آن استفاده شود.
- ID Screen Influenza A NP Indirect (FLUNPS): آنتی‌بادی NP؛ بروشور سازنده کاربرد DIVA را فقط در ترکیب مشخص با H5 indirect و پرندگان واکسینه‌شده با rHVT-H5 alone بیان می‌کند. این ادعا را به همه برنامه‌های واکسیناسیون یا واکسن‌های H5 تعمیم ندهیم.
- ID Screen Influenza H5 Indirect (FLUH5S): هدف HA-H5 recombinant protein، quantitative؛ سازنده آن را برای پایش واکسن‌های inactivated و recombinant معرفی می‌کند و می‌گوید H5 strain coverage دارد. این به معنی شناسایی clade/strain خاص یا اثبات حفاظت نیست.
- IDvet ND/IBV و دیگر ELISAها دارای product-specific matrices و IFU هستند.
منابع: 
https://www.innovative-diagnostics.com/produit/id-screen-ibd-indirect/
https://www.innovative-diagnostics.com/produit/id-screen-ibd-vp2/
https://www.innovative-diagnostics.com/produit/id-screen-influenza-a-nucleoprotein-indirect/
https://www.innovative-diagnostics.com/produit/id-screen-influenza-h5-indirect/
https://www.innovative-diagnostics.com/pro-access-en/
### ایده‌های قابل اقتباس
1. Disease × assay × vaccine platform eligibility matrix؛ موتور IBD باید بر اساس conventional vs recombinant VP2 تفکیک شود.
2. ثبت target antigen صریح (IBD purified antigen vs recombinant VP2؛ Influenza NP vs H5 HA).
3. نگهداری IFU/matrix version و فرمول محاسبه به ازای kit code و نسخه.
4. Import OD/Excel/XML؛ ورود دستی به عنوان fallback؛ parserهای vendor به شکل adapter.
5. baseline و vaccination-age outputs فقط وقتی kit/model supported و ورودی‌های مورد نیاز کامل‌اند.
6. DIVA logic به‌صورت یک rule-set محدود، فقط وقتی ترکیب واکسن، target assay و claim سازنده/شواهد دقیقاً با هم منطبق باشند.
7. مرجع مثبت/منفی و control serum record؛ control pools و positive reference sera باید به lot/run وصل شوند.
### General Baselines March 2026
پرتال رسمی IDvet سند «IDvet Poultry General Baselines March 2026» را فهرست می‌کند. فایل baseline در دسترس distributor portal است؛ محتوای کامل آن در این مرور بازیابی نشده است. بنابراین نباید اعداد آن را وارد نرم‌افزار کنیم تا فایل اصلی، بیماری، کیت، نسخه و شرایط مطالعه دقیقاً بررسی شوند.
### احتیاط
ID Soft brochure 2022 است؛ سازگاری با سیستم‌عامل‌ها، نسخه فعلی، پشتیبانی فعال، دسترسی رایگان فعلی و فایل‌های خروجی باید از سازنده/نسخه واقعی تأیید شود. هیچ ادعای compatibility خودکار با ID Soft بدون فایل نمونه پذیرفته نیست.

## 4) Biogal
- ImmunoComb یک پلتفرم point-of-care بر پایه Dot-ELISA، نیمه‌کمی و سریع (~23 دقیقه طبق سازنده) است؛ امکانات automation با RoboComb+/CombCam/Plate Warmer برای کاهش دخالت و تفسیر subjective معرفی شده است.
- صفحات فعلی محصول عمدتاً تست‌های companion animals (سگ/گربه) و واکسن‌های core آن‌ها را نشان می‌دهند؛ در این مرور شواهد رسمی کافی برای یک نرم‌افزار حرفه‌ای flock serology مرغ گوشتی/تخم‌گذار یا محصول poultry flock trend مشابه BioChek/IDEXX پیدا نشد.
منابع: https://www.biogal.com/products/immunocomb/ ; https://biogal.com/products/
### اقتباس
اصل point-of-care و کاهش خطای اپراتور از طریق color/reader/image capture قابل بررسی است، اما نباید محصول یا الگوریتم سگ/گربه را به مرغ تعمیم داد. برای poultry تنها پس از شناسایی محصول/IFU و validation مستقل.

## 5) LIMS / آزمایشگاه‌های بزرگ و اکوسیستم داده
Thermo Fisher SampleManager LIMS یک نمونه از معماری مدیریت نمونه، داده، فرایند، QC/QA، SDMS/ELN و اتصال instrument و customer systems است. این محصول مخصوص poultry serology نیست؛ الگوی معماری آن برای chain-of-custody، sample accessioning، audit trail، instrument interface و QC مفید است.
منبع: https://www.thermofisher.com/us/en/home/digital-solutions/lab-informatics/lab-information-management-systems-lims/solutions/samplemanager.html
### اقتباس
- Sample accession ID، barcode, chain-of-custody, sample received/processed/released timestamps.
- Audit trail immutable: raw input, edit, who/when/why, model version.
- Run-level QC and release state; results can be Draft/Under review/Released.
- Data lineage from original file → mapped rows → raw observations → derived metrics → report.

## 6) چارچوب علمی WOAH — مهم‌ترین بخش
WOAH Terrestrial Manual chapter 1.1.6 تأکید می‌کند که اعتبار assay وابسته به intended purpose، species/specimen، validation characteristics و monitoring عملکرد روزمره است. کنترل‌های داخلی باید در هر run پایش شوند؛ نمودار کنترل برای رفتار کنترل‌ها، و external proficiency testing/inter-lab comparisons برای reproducibility/harmonization اهمیت دارند.
منبع: https://www.woah.org/fileadmin/Home/eng/Health_standards/tahm/1.01.06_VALIDATION.pdf
WOAH همچنین راهنمای ارزیابی توان آزمایشگاه و proficiency testing را ارائه می‌دهد: https://www.woah.org/en/what-we-offer/expertise-network/reference-laboratories/
### قابلیت‌های با اولویت بسیار بالا برای برنامه
1. Run QC panel: negative/positive controls, expected range, observed value, pass/fail/warning per IFU.
2. Control chart: per assay/kit/lot, date and run; warning for drift/trend/outlier; do not apply generic Westgard rules unless method and lab validation support it.
3. Lot bridging: compare old/new lots using paired panels and pre-specified acceptance criteria supplied by manufacturer/lab; no universal cutoff.
4. Inter-lab comparability: record lab, platform, kit, lot, protocol, units; show side-by-side only until a validated conversion/equivalence study exists.
5. External proficiency testing record: provider, panel, date, score, corrective action.
6. Assay intended-purpose label: monitoring vaccine response, screening exposure, DIVA, MDA/quantitative titre etc.; do not reuse validation claim for another purpose.
7. QC gate: invalid run blocks downstream interpretation; raw values remain saved with invalid status and reason.

## 7) Additional evidence-based product design ideas
### Sample logistics
- QR/barcode label for each sample and sample set; printable submission form.
- Sampling design: random vs convenience; house/pen/box strata; bird IDs; pooled vs individual; target n; inclusion/exclusion.
- Collection, serum separation, storage temperature/time, transport conditions, freeze-thaw count, hemolysis/lipemia, specimen matrix.
- Chain-of-custody and sample received/rejected reason.
### Report structure
- Flock snapshot + assay/QC status.
- Raw data and per-sample result table.
- Distribution histogram + boxplot/percentiles.
- Trend chart with vaccination events, sample age, kit/lot changes.
- Comparability warning when assay/lot/units change.
- Interpretation separated into observed facts, calculated values, statistical signals, hypotheses and next data.
### Analytics
- Use GMT only for positive ratio-scale titres and report log transform; do not compute GMT on HI log2 as if it were reciprocal titre.
- CV must name its scale; CV on reciprocal titres differs from SD of log2 HI.
- Outlier flag must not auto-delete samples.
- Paired inference requires bird ID, matched assay/units and meaningful timing; independent cross-sectional samples must not be labeled paired.
- For proportion/prevalence estimates, use binomial confidence intervals and account for clustering/design effect; for mean titres, plan sample size around variance/precision. No universal sample number.
- Change-point/trend algorithms only after sufficient repeated observations; report uncertainty and do not turn exploratory alerts into disease diagnosis.
- Do not convert S/P, OD, titre, HI and VN to one scale without validated calibration.
### MDA
- separate conventional live-vaccine Deventer calculation from MDA decay estimation and from recombinant VP2/immune-complex models.
- support day 0/day 1/day 2 sampling with explicit hatch timestamp and actual sample age.
- store observed titer vs reconstructed hatch titer separately.
- use assay-specific half-life and threshold with source; provide sensitivity analysis only where parameter ranges are defensible.
- never infer a universal half-life or universal protective threshold.
### Vaccine/strain registry
- vaccine product, platform, manufacturer, strain, antigen expressed, route, age, batch, label jurisdiction, date, source.
- separate vaccine strain, kit coated antigen/target, field isolate/genotype, reference challenge strain.
- for H5, record HA subtype, clade/lineage, isolate/accession and vaccine platform; NP vs H5-HA assay must remain distinct.
- for IBV, record genotype/variant and assay antigen, but don't infer cross-protection from matching name.
- for IBD, record conventional live/inactivated vs HVT-VP2 or other recombinant, and select assay/model eligibility accordingly.
- user custom strain/kit remains possible; mark unverified and never enable unsupported calculation.
### Data governance and interoperability
- Internal canonical schema + vendor-specific adapters.
- import preview, mapping, validation, duplicate detection, rejected row report, source file hash.
- raw data immutable; corrections append version and audit trail.
- export JSON/CSV/XLSX/PDF; preserve model/IFU versions and citations.
- multi-lab normalization only after bridge study; no hidden conversion.

## 8) Prioritization
### P0 (scientific integrity)
- assay/kit/IFU version-specific calculation matrix
- distinct IBD conventional vs IBD-VP2 models
- raw OD and calculated titer stored separately
- QC controls and run release gate
- provenance and audit trail
- paired ID validation
- sample age 0–4 days MDA and explicit measured vs estimated distinction
- block unsupported calculations
### P1 (large practical value)
- IDvet ID Soft inspired CSV/XLSX/OD import; template + preview + mapping
- barcode/QR sample submission
- multi-lab/farm/house trend dashboard
- histogram, boxplot, control chart, vaccination timeline
- reference sera and lot bridging workflow
- role-based reviewer and release
### P2 (validation dependent)
- vendor-specific import adapters
- DIVA workflows for precisely supported vaccine/assay combinations
- MDA uncertainty and individual longitudinal decay fit
- baseline reference library, with provenance and local stratification
- statistical process control thresholds validated per assay/lab
### P3 (not implement now)
- AI disease diagnosis from antibody profile
- automatic vaccine recommendation based only on titre
- universal cross-kit conversion
- universal protection score
- automatic strain identification from ELISA titres
- generic QC rules without validation.

## 9) Release and evidence requirements
Every feature record must contain: intended purpose, species, specimen, assay method, kit code, IFU/matrix version, raw input, output unit, formula, reference, evidence level, verification date, limits, tests and responsible reviewer.
Evidence levels:
A: current manufacturer IFU/validation or WOAH standard;
B: peer-reviewed validation/review for same assay and purpose;
C: official brochure/product page but no full validation details;
D: user-entered/unverified.
Only A/B can enable clinical-grade calculations; C may populate metadata and descriptive outputs; D is stored but never enables an unsupported engine.
A successful CI run is software quality evidence, not biological/diagnostic validation.

## منابع رسمی منتخب
- BioChek Monitoring Software: https://www.biochek.com/software/
- BioChek Poultry system: https://www.biochek.com/poultry/
- IDEXX xChekPlus: https://www.idexx.com/en/livestock/xchekplus-software/
- IDEXX xChek Lab/Vet: https://www.idexx.com/en/livestock/xcheklab-software/
- ID Soft brochure: https://www.innovative-diagnostics.com/wp-content/uploads/2022/11/Brochure-IDSOFT_0922_EN_doc13851.pdf
- IDvet Avian: https://www.innovative-diagnostics.com/espece/avian/
- IDvet IBD conventional: https://www.innovative-diagnostics.com/produit/id-screen-ibd-indirect/
- IDvet IBD VP2: https://www.innovative-diagnostics.com/produit/id-screen-ibd-vp2/
- IDvet Influenza NP: https://www.innovative-diagnostics.com/produit/id-screen-influenza-a-nucleoprotein-indirect/
- IDvet Influenza H5: https://www.innovative-diagnostics.com/produit/id-screen-influenza-h5-indirect/
- IDvet Pro portal / IFUs / matrices: https://www.innovative-diagnostics.com/pro-access-en/
- Biogal ImmunoComb: https://www.biogal.com/products/immunocomb/
- Thermo SampleManager LIMS: https://www.thermofisher.com/us/en/home/digital-solutions/lab-informatics/lab-information-management-systems-lims/solutions/samplemanager.html
- WOAH Terrestrial Manual 1.1.6: https://www.woah.org/fileadmin/Home/eng/Health_standards/tahm/1.01.06_VALIDATION.pdf
- UF/IFAS poultry serology monitoring: https://ask.ifas.ufl.edu/publication/VM102


## 10) تکمیل بررسی اختصاصی کیت‌های ND و IBV در IDvet (منابع رسمی محصول)
این بررسی تکمیلی نشان داد تفکیک پلتفرم واکسن در ND و IBV نیز باید صریح‌تر از یک فیلد عمومی vaccine strain باشد.

### ND
IDvet حداقل چهار مسیر متفاوت معرفی می‌کند:
- NDVS-CV: پایش واکسن‌های conventional زنده/غیرفعال.
- NDVS: پایش rHVT-F-ND؛ محصول برای پایش پاسخ علیه آنتی‌ژن F معرفی شده است.
- NDVNP: آنتی‌بادی علیه nucleoprotein؛ در کنار NDVS می‌تواند در راهبرد DIVA مشخص برای پرندگان دریافت‌کننده rHVT-F به‌کار رود.
- NDVC: competitive ELISA برای anti-NDV در طیور اهلی و وحشی؛ کاربرد ویژه پایش در مناطقی که واکسیناسیون انجام نمی‌شود.
منابع: https://www.innovative-diagnostics.com/produit/id-screen-newcastle-disease-indirect/ ; https://www.innovative-diagnostics.com/produit/id-screen-newcastle-disease-indirect-conventional-vaccines/ ; https://www.innovative-diagnostics.com/produit/id-screen-newcastle-disease-nucleoprotein-indirect/ ; https://www.innovative-diagnostics.com/produit/id-screen-newcastle-disease-competition/
**قانون موتور:** conventional ND ELISA و rHVT-F specific ELISA و NDV-NP ELISA نباید یک assay واحد تلقی شوند. DIVA فقط برای همان واکسن و ترکیب assay ذکرشده قابل نمایش است؛ هر نوع واکسن زنده/کشته یا HVT دیگر، DIVA خودکار را فعال نمی‌کند.

### IBV
ID Screen Infectious Bronchitis Indirect 2.0 از یک recombinant protein محافظت‌شده استفاده می‌کند و سازنده تشخیص آنتی‌بادی علیه طیف وسیعی از variantها، از جمله QX و 793B و 4/91 را ادعا می‌کند. این موضوع به معنای تشخیص اختصاصی سویه QX یا 793B با سرولوژی نیست؛ بلکه طبق سازنده، assay برای پوشش broad antibody detection طراحی شده است.
منبع: https://www.innovative-diagnostics.com/produit/id-screen-infectious-bronchitis-indirect-2-0/
IDvet همچنین ID Gene IBV Duplex RT-qPCR را با target تشخیصی و exogenous internal control و positive amplification control معرفی می‌کند؛ دامنه تشخیص اعلام‌شده شامل variantهای IBV متعدد از جمله QX، 4/91، Arkansas و Mass است.
منبع: https://www.innovative-diagnostics.com/produit/id-gene-infectious-bronchitis-duplex/
**قانون موتور:** serology broad-reactive IBV را برای genotype/variant identification استفاده نکنیم؛ برای شناسایی سویه میدانی به PCR و در موارد لازم sequencing نیاز است. آنتی‌بادی مثبت یا بالا، به‌تنهایی تعیین نمی‌کند کدام variant عامل بوده یا cross-protection برقرار است.

### AIV / DIVA
IDvet دو هدف مجزا معرفی می‌کند:
- NP indirect یا NP competitive برای anti-influenza A NP؛
- H5 indirect برای anti-H5 HA.
سازنده در شرایط مشخص rHVT-H5 alone، ترکیب NP + H5 را برای DIVA معرفی می‌کند. این را نباید به واکسن‌های inactivated H5 یا ترکیب‌های چندگانه تعمیم داد. H5 antibody assay پوشش وسیع‌تر H5 را بیان می‌کند، اما clade identification یا protection prediction نیست.
منابع: https://www.innovative-diagnostics.com/produit/id-screen-influenza-a-nucleoprotein-indirect/ ; https://www.innovative-diagnostics.com/produit/id-screen-influenza-a-antibody-competition-multi-species/ ; https://www.innovative-diagnostics.com/produit/id-screen-influenza-h5-indirect/

### نکته بسیار مهم برای بانک سویه و مدل
Registry باید به جای یک strain field دارای نقش‌های مجزا باشد:
- vaccine vector backbone (مثلاً HVT)
- expressed vaccine antigen (مثلاً NDV-F، IBDV-VP2، AIV-H5)
- kit coated antigen / assay target (مثلاً NDV purified antigen، NDV-NP، IBV conserved recombinant protein، influenza NP، H5-HA)
- field isolate/genotype/sequence
- reference/challenge strain
و rule-engine تنها با تطابق دقیق platform × antigen × assay × intended purpose اجازه DIVA یا vaccine-specific interpretation دهد.
