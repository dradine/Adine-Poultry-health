update public.assay_kits
set source_version = 'BioChek Poultry ELISA Interpretation Manual RevB 2025; official CK113 IBD product information; accessed 2026-11-16',
    source_document = 'BioChek official CK113 IBD product information and Poultry ELISA Interpretation Manual RevB 2025',
    protocol_version = 'CK113 product information + BioChek Poultry ELISA Interpretation Manual RevB 2025'
where manufacturer = 'BioChek BV' and catalog_number = 'CK113 IBD';
