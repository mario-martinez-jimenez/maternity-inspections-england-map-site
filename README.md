# England maternity inspection map

**[Open the interactive map — no sign-in required](https://mario-martinez-jimenez.github.io/maternity-inspections-england-map-site/)**

This public website contains 179 CQC maternity inspection records at 166 locations in England, covering 2022–2023: 131 national programme records and 48 additional documented visits. The additional visits are not a certified census of all inspections.

Search by hospital, trust or postcode. Filter by visit year, inspection group, reason and date precision. Select a location to see dates, context, uncertainty notes, original sources and saved document-page previews. Nearby and repeated records are clustered for display.

- [Reviewed inspection records (Excel)](records/England_maternity_inspections_2022_2023.xlsx)
- [Research context and date qualifications (PDF)](records/README_England_maternity_inspections.pdf)

Visit dates are distinct from publication dates. There are 112 single preferred days, 66 date periods and one unconfirmed maternity follow-up date at Birmingham Heartlands. Period bounds do not establish attendance on every intervening day. St Mary's Birth Centre has no retained original PDF preview; its source links and archived CQC context are supplied and the gap is flagged.

The inspection reasons comprise 128 routine programme records, 27 concern-triggered visits, 19 follow-ups, 3 mixed cases and 2 unclear reasons. These are documented selection reasons, not evidence of exogenous timing. The map does not contain patient-level data or implement HES linkage. England is the scope because [HES describes care in English hospitals](https://digital.nhs.uk/data-and-information/data-tools-and-services/data-services/hospital-episode-statistics).

Map points use postcode coordinates checked on 6 November 2026; maternity-building or entrance locations and historical addresses are not established by geocoding. Read each record's qualifications before using it for exposure assignment.

The repository contains the website files, map data, 519 source-page PNGs and the two research downloads, published with the owner's explicit approval. Research working documents are maintained separately. Updates to `main` are deployed through GitHub Pages. The app is buildless: open `index.html` directly or serve the folder with a static HTTP server. Street tiles and external source links require internet access.

Source reports are attributed to the Care Quality Commission and used under its [Open Government Licence terms](https://www.cqc.org.uk/about-us/our-policies/terms-conditions). NHS supporting documents retain their publishers' rights and are linked individually. Boundaries contain ONS and Ordnance Survey data © Crown copyright and database right 2023, licensed under OGL v3. Postcodes.io attribution: contains Ordnance Survey data © Crown copyright and database right 2025; Royal Mail data © Royal Mail copyright and database right 2025; National Statistics data © Crown copyright and database right 2025; NRS data © Crown copyright and database right 2025. See [Postcodes.io licences](https://postcodes.io/docs/licences/). Optional street maps © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Leaflet and MarkerCluster retain their bundled MIT licences in `assets/vendor/`.
