@echo off
echo ============================================
echo Malwa CRM - Creating Data Directory Structure
echo ============================================
echo.

REM Create main directory
if not exist "C:\malwa-crm" (
    mkdir "C:\malwa-crm"
    echo Created: C:\malwa-crm
)

if not exist "C:\malwa-crm\Data_base" (
    mkdir "C:\malwa-crm\Data_base"
    echo Created: C:\malwa-crm\Data_base
)

REM Create module directories
if not exist "C:\malwa-crm\Data_base\accounts" mkdir "C:\malwa-crm\Data_base\accounts"
if not exist "C:\malwa-crm\Data_base\customer" mkdir "C:\malwa-crm\Data_base\customer"
if not exist "C:\malwa-crm\Data_base\inventory" mkdir "C:\malwa-crm\Data_base\inventory"
if not exist "C:\malwa-crm\Data_base\jobs" mkdir "C:\malwa-crm\Data_base\jobs"
if not exist "C:\malwa-crm\Data_base\labour" mkdir "C:\malwa-crm\Data_base\labour"
if not exist "C:\malwa-crm\Data_base\settings" mkdir "C:\malwa-crm\Data_base\settings"
if not exist "C:\malwa-crm\Data_base\summary" mkdir "C:\malwa-crm\Data_base\summary"
if not exist "C:\malwa-crm\Data_base\supplier" mkdir "C:\malwa-crm\Data_base\supplier"
if not exist "C:\malwa-crm\Data_base\vendors" mkdir "C:\malwa-crm\Data_base\vendors"
if not exist "C:\malwa-crm\Data_base\GoogleDrive_Sync" mkdir "C:\malwa-crm\Data_base\GoogleDrive_Sync"
if not exist "C:\malwa-crm\Data_base\Automatic Backups" mkdir "C:\malwa-crm\Data_base\Automatic Backups"

REM Create Settings subdirectories (hierarchical structure)
if not exist "C:\malwa-crm\Data_base\settings\General" mkdir "C:\malwa-crm\Data_base\settings\General"
if not exist "C:\malwa-crm\Data_base\settings\My_Profile" mkdir "C:\malwa-crm\Data_base\settings\My_Profile"
if not exist "C:\malwa-crm\Data_base\settings\Company_Master" mkdir "C:\malwa-crm\Data_base\settings\Company_Master"
if not exist "C:\malwa-crm\Data_base\settings\Rate_List_Memory" mkdir "C:\malwa-crm\Data_base\settings\Rate_List_Memory"
if not exist "C:\malwa-crm\Data_base\settings\User_Management" mkdir "C:\malwa-crm\Data_base\settings\User_Management"
if not exist "C:\malwa-crm\Data_base\settings\Security" mkdir "C:\malwa-crm\Data_base\settings\Security"
if not exist "C:\malwa-crm\Data_base\settings\User_Login" mkdir "C:\malwa-crm\Data_base\settings\User_Login"
if not exist "C:\malwa-crm\Data_base\settings\Legacy" mkdir "C:\malwa-crm\Data_base\settings\Legacy"

echo.
echo Module directories created successfully:
echo   - accounts
echo   - customer
echo   - inventory
echo   - jobs
echo   - labour
echo   - settings (with subdirectories)
echo       * General
echo       * My_Profile
echo       * Company_Master
echo       * Rate_List_Memory
echo       * User_Management
echo       * Security
echo       * User_Login
echo       * Legacy
echo   - summary
echo   - supplier
echo   - vendors
echo   - GoogleDrive_Sync
echo   - Automatic Backups
echo.
echo ============================================
echo Directory structure created successfully!
echo Data will be stored in: C:\malwa-crm\Data_base\
echo ============================================
echo.
pause
