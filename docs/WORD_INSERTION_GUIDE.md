# Word Document Insertion Guide
## Quick Reference for Adding Screenshots

**Purpose**: Simple guide for inserting diagrams into Word document  
**Estimated Time**: ~30 minutes  

---

## 🎯 **Quick 3-Step Process**

### **STEP 1**: Take Screenshots (15 minutes)
1. Open `docs/PMP_DIAGRAMS_FOR_SCREENSHOTS.md`
2. Use **Win + Shift + S** (Windows Snipping Tool)
3. Screenshot each table/diagram
4. Save in `screenshots/` folder with suggested names

### **STEP 2**: Convert Text to Word (2 minutes)
1. Run: `python scripts/convert_pmp_to_word.py`
2. Opens `PMP-Quality-Standards-FINAL.docx`

### **STEP 3**: Insert Screenshots (15 minutes)
1. Find the placeholder text (e.g., `[INSERT TABLE 1...]`)
2. Delete placeholder text
3. **Insert → Pictures** → Select screenshot
4. **Resize** to ~6 inches wide
5. **Center align** the image
6. Repeat for all 16 images

---

## 📋 **Screenshot Checklist**

| # | File Name | Section | Status |
|---|-----------|---------|--------|
| 1 | `diagram-6-1-architecture.png` | 6.1 Architecture | □ |
| 2 | `table-5-4-raci.png` | 5.4 Resource Management | □ |
| 3 | `table-5-5-risks.png` | 5.5 Risk Management | □ |
| 4 | `table-6-2-core-tables.png` | 6.2 Core Tables | □ |
| 5 | `table-6-2-request-tables.png` | 6.2 Request Tables | □ |
| 6 | `table-6-2-approval-tables.png` | 6.2 Approval Tables | □ |
| 7 | `table-6-3-integrations.png` | 6.3 Integration | □ |
| 8 | `table-6-4-test-metrics.png` | 6.4 Test Metrics | □ |
| 9 | `table-8-1-environments.png` | 8.1 Environments | □ |
| 10 | `table-8-3-migration.png` | 8.3 Migration | □ |
| 11 | `table-9-1-training.png` | 9.1 Training | □ |
| 12 | `table-9-2-user-docs.png` | 9.2 User Docs | □ |
| 13 | `table-9-2-admin-docs.png` | 9.2 Admin Docs | □ |
| 14 | `table-9-3-operations.png` | 9.3 Operations | □ |
| 15 | `table-10-1-support.png` | 10.1 Support Levels | □ |
| 16 | `table-10-2-sla.png` | 10.2 SLA Matrix | □ |
| 17 | `table-11-f-changelog.png` | Appendix F | □ |

---

## 📝 **Placeholder Text to Find in Word**

Search for these exact phrases in Word (Ctrl + F):

1. `[INSERT DIAGRAM 1: Three-Tier Architecture`
2. `[INSERT TABLE 1: RACI Matrix`
3. `[INSERT TABLE 2: Risk Register`
4. `[INSERT TABLE 3: Module Test Metrics`
5. `[INSERT TABLE 4: Core Tables`
6. `[INSERT TABLE 5: Request Tables`
7. `[INSERT TABLE 6: Multi-Approval Tables`
8. `[INSERT TABLE 7: External Integration`
9. `[INSERT TABLE 8: Environment Strategy`
10. `[INSERT TABLE 9: Data Migration`
11. `[INSERT TABLE 10: Training Audience`
12. `[INSERT TABLE 11: User Documentation`
13. `[INSERT TABLE 12: Admin Documentation`
14. `[INSERT TABLE 13: Operational Metrics`
15. `[INSERT TABLE 14: Support Tier`
16. `[INSERT TABLE 15: SLA Severity`
17. `[INSERT TABLE 16: Change Log`

---

## 🖼️ **Image Insertion Settings**

For each screenshot:
1. **Delete** placeholder text
2. **Insert** → **Pictures** → **This Device**
3. **Select** screenshot file
4. **Right-click image** → **Wrap Text** → **In Line with Text**
5. **Right-click image** → **Size and Position**
   - Width: ~6 inches (or scale to fit)
   - Keep aspect ratio locked
6. **Home tab** → **Center align** button
7. **Add spacing**: Format → Paragraph → Before: 6pt, After: 6pt

---

## ⚡ **Speed Tips**

### Fastest Method:
1. Screenshot all 17 diagrams first (~15 min)
2. Open Word document
3. Use **Ctrl + F** to find each placeholder quickly
4. Insert all images in sequence
5. Select all images (Ctrl + click each)
6. Right-click → Size → Set all to 6 inches wide
7. Center align all at once

### Quality Check:
- ✅ All 17 placeholders replaced
- ✅ All images centered
- ✅ All images readable
- ✅ Consistent sizing
- ✅ No broken image links

---

## 🎨 **Final Touches**

### After All Images Inserted:
1. **Generate TOC**:
   - Place cursor after title page
   - References → Table of Contents → Automatic Table
   
2. **Check Formatting**:
   - Scroll through entire document
   - Verify all images display correctly
   - Ensure no page breaks in wrong places
   
3. **Update TOC**:
   - Right-click TOC → Update Field → Update entire table
   
4. **Save Final Version**:
   - Save As → New name if needed
   - Consider saving as PDF for distribution

---

## 📊 **Expected Result**

**Professional PMP Document with:**
- ✅ Auto-generated Table of Contents
- ✅ 17 professional diagrams and tables
- ✅ Consistent formatting throughout
- ✅ Ready for stakeholder presentation
- ✅ Print-ready quality

**Total Time**: ~30 minutes  
**Quality**: ⭐⭐⭐⭐⭐ Professional  
**Status**: Ready for review and approval

---

## 🆘 **Troubleshooting**

**Problem**: Screenshot looks blurry
- **Solution**: Take screenshot at 100% zoom, save as PNG

**Problem**: Table doesn't fit page width
- **Solution**: Resize image to 6 inches wide maximum

**Problem**: Can't find placeholder text
- **Solution**: Use Ctrl + F (Find) to search for `[INSERT TABLE`

**Problem**: Image breaks across pages
- **Solution**: Right-click → Paragraph → Keep with next

---

**Ready to start!** ╰(*°▽°*)╯  
**All diagrams are in**: `docs/PMP_DIAGRAMS_FOR_SCREENSHOTS.md`  
**Clean text version**: `PMP-Quality-Standards-CLEAN.txt`

