# 📊 Excel/CSV Format Guide for MR Communication Tool

## 🎯 **Overview**
The MR Communication Tool supports two main data import formats:
1. **Backend Excel/CSV Import** - For bulk uploading Medical Representatives via API
2. **Frontend CSV Import** - For the simplified tool with local storage

## 📋 **Backend Excel/CSV Format (Full System)**

### **Excel Template Format**
Use this format when uploading Medical Representatives through the main system:

| Column Header | Required | Data Type | Example | Description |
|---------------|----------|-----------|---------|-------------|
| **MR ID** | ✅ Yes | String | MR001 | Unique identifier for the Medical Rep |
| **First Name** | ✅ Yes | String | John | Medical Rep's first name |
| **Last Name** | ✅ Yes | String | Doe | Medical Rep's last name |
| **Group Name** | ✅ Yes | String | North Region | Group/Region name (must exist in system) |
| **Marketing Manager** | ⚠️ Optional | String | Manager Name | Name of the marketing manager |
| **Phone** | ✅ Yes | String | +919876543210 | WhatsApp number with country code |
| **Email** | ⚠️ Optional | String | john.doe@example.com | Email address |
| **Address** | ⚠️ Optional | String | 123 Main St, City | Complete address |
| **Comments** | ⚠️ Optional | String | Senior MR with 5 years experience | Additional notes |

### **Sample Excel Data:**
```excel
MR ID    | First Name | Last Name | Group Name   | Marketing Manager | Phone          | Email                  | Address               | Comments
---------|------------|-----------|--------------|-------------------|----------------|------------------------|-----------------------|------------------
MR001    | John       | Doe       | North Region | Manager Smith     | +919876543210  | john.doe@example.com   | 123 Main St, Mumbai   | Senior MR
MR002    | Jane       | Smith     | South Region | Manager Jones     | +919876543211  | jane.smith@example.com | 456 Oak Ave, Delhi    | New hire
MR003    | Mike       | Johnson   | East Region  | Manager Brown     | +919876543212  | mike.j@example.com     | 789 Pine Rd, Kolkata  | Specialist
```

### **Backend Validation Rules:**
- **MR ID**: Must be unique across the system
- **Phone**: Must be in international format (+country code + number)
- **Group Name**: Must match existing group in the system
- **Email**: Must be valid email format (if provided)

## 📱 **Frontend CSV Format (Simple Tool)**

### **CSV Template Format**
Use this format for the simplified local storage tool:

| Column Header | Required | Data Type | Example | Description |
|---------------|----------|-----------|---------|-------------|
| **MR ID** | ✅ Yes | String | MR001 | Unique identifier |
| **First Name** | ✅ Yes | String | John | First name |
| **Last Name** | ✅ Yes | String | Doe | Last name |
| **Phone** | ✅ Yes | String | +919876543210 | WhatsApp number |
| **Group** | ✅ Yes | String | North Zone | Group name |
| **Comments** | ⚠️ Optional | String | Senior MR | Additional notes |

### **Sample CSV Data:**
```csv
MR ID,First Name,Last Name,Phone,Group,Comments
MR001,John,Doe,+919876543210,North Zone,Senior MR
MR002,Jane,Smith,+919876543211,South Zone,New hire
MR003,Mike,Johnson,+919876543212,East Zone,Specialist
```

### **Frontend Validation Rules:**
- All required fields must be filled
- Phone numbers are auto-formatted
- Groups are created automatically if they don't exist

## 📥 **How to Download Templates**

### **Backend System Template**
```bash
# API endpoint to download Excel template
GET /api/mrs/template

# Using curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/mrs/template \
  --output mr_template.xlsx
```

### **Frontend Simple Tool Template**
1. Go to SimpleMRTool: `http://localhost:5173/simple-tool`
2. Navigate to "Contacts" tab
3. Click "Download Template" button
4. File will be downloaded as `mr_contacts_template.csv`

## 📤 **How to Import Data**

### **Backend Excel Import**
1. **Prepare Excel File**: Use the template format above
2. **Go to Medical Reps**: Navigate to `/mrs` page
3. **Upload File**: Use the bulk upload section
4. **Review Data**: Check validation results
5. **Confirm Import**: Complete the import process

### **API Import (Programmatic)**
```bash
# Upload via API
curl -X POST http://localhost:5001/api/mrs/bulk-upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@medical_reps.xlsx"
```

### **Frontend CSV Import**
1. **Go to Simple Tool**: Navigate to `/simple-tool`
2. **Contacts Tab**: Click on "Contacts" section
3. **CSV Import**: Use the file upload area
4. **Select File**: Choose your CSV file
5. **Auto Import**: Data is imported automatically

## 🔧 **Advanced Format Features**

### **Flexible Column Headers**
The backend system accepts various column header formats:

| Standard Header | Alternative Headers |
|----------------|-------------------|
| MR ID | ID, mrid, mr_id |
| First Name | fname, firstname, first_name |
| Last Name | lname, lastname, last_name |
| Group Name | group, groupname, group_name |
| Marketing Manager | manager, marketingmanager |

### **Phone Number Formats**
All these formats are automatically converted:
- `+919876543210` ✅ (Preferred format)
- `919876543210` ✅ (Auto-adds +)
- `9876543210` ✅ (Auto-adds +91 for India)
- `+91-987-654-3210` ✅ (Auto-removes dashes)
- `+91 9876 543 210` ✅ (Auto-removes spaces)

### **Group Name Handling**
- **Backend**: Groups must exist before importing MRs
- **Frontend**: Groups are created automatically during import

## ⚠️ **Common Issues & Solutions**

### **Issue 1: Invalid Phone Numbers**
```
Error: Invalid phone number format
Solution: Use international format: +countrycode + number
Example: +919876543210 (not 9876543210)
```

### **Issue 2: Group Not Found**
```
Error: Group 'XYZ Region' not found
Solution: Create the group first, then import MRs
```

### **Issue 3: Duplicate MR IDs**
```
Error: MR ID 'MR001' already exists
Solution: Use unique MR IDs or update existing records
```

### **Issue 4: Invalid Email Format**
```
Error: Invalid email format
Solution: Use proper email format: name@domain.com
```

## 📊 **Data Validation Summary**

### **Required Fields:**
- ✅ MR ID (must be unique)
- ✅ First Name (minimum 2 characters)
- ✅ Last Name (minimum 2 characters)
- ✅ Phone (international format)
- ✅ Group Name (must exist in backend)

### **Optional Fields:**
- ⚠️ Email (validated if provided)
- ⚠️ Address (any text)
- ⚠️ Comments (any text)
- ⚠️ Marketing Manager (any text)

### **Auto-Generated Fields:**
- 🔄 Created At (timestamp)
- 🔄 Updated At (timestamp)
- 🔄 Internal IDs (database IDs)

## 🎯 **Best Practices**

### **Data Preparation:**
1. **Clean Phone Numbers**: Remove spaces, dashes, parentheses
2. **Consistent Groups**: Use exact group names as in system
3. **Unique MR IDs**: Ensure no duplicates
4. **Valid Emails**: Check email format if providing

### **Import Process:**
1. **Start Small**: Test with 5-10 records first
2. **Check Groups**: Ensure all groups exist before import
3. **Validate Data**: Review validation errors before proceeding
4. **Backup Data**: Keep a copy of original file

### **Post-Import:**
1. **Verify Count**: Check total MRs imported
2. **Test Messages**: Send test campaign to verify phone numbers
3. **Review Groups**: Ensure MRs are in correct groups
4. **Update Info**: Correct any data issues found

## 🚀 **Ready-to-Use Templates**

### **Excel Template (Backend)**
[Download this template and fill with your data]

| MR ID | First Name | Last Name | Group Name | Marketing Manager | Phone | Email | Address | Comments |
|-------|------------|-----------|------------|-------------------|-------|-------|---------|----------|
| MR001 | | | | | +91 | | | |
| MR002 | | | | | +91 | | | |
| MR003 | | | | | +91 | | | |

### **CSV Template (Frontend)**
```csv
MR ID,First Name,Last Name,Phone,Group,Comments
MR001,,,+91,,
MR002,,,+91,,
MR003,,,+91,,
```

## 🎉 **You're Ready to Import!**

Use these formats to import your Medical Representatives data and start sending WhatsApp campaigns immediately! 📱💬
