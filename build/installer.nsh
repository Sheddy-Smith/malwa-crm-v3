; ============================================================================
; Malwa CRM - NSIS Installer Configuration
; ============================================================================
; Custom NSIS script for advanced installer features

!include "MUI2.nsh"

; Custom installer text
!define MUI_WELCOMEPAGE_TITLE "Welcome to Malwa CRM Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of Malwa CRM.$\r$\n$\r$\nMalwa CRM is a comprehensive business management solution for trolley and transport businesses.$\r$\n$\r$\nClick Next to continue."

; Custom installation directory
!define MUI_DIRECTORYPAGE_TEXT_TOP "Setup will install Malwa CRM in the following folder. To install in a different folder, click Browse and select another folder. Click Next to continue."

; Custom components page
!define MUI_COMPONENTSPAGE_TEXT_TOP "Select the components you want to install and clear the components you do not want to install. Click Next to continue."

; Finish page customization
!define MUI_FINISHPAGE_TITLE "Completing Malwa CRM Setup"
!define MUI_FINISHPAGE_TEXT "Malwa CRM has been successfully installed on your computer.$\r$\n$\r$\nOn first launch, the application will automatically create the database structure at C:\malwa-crm\Data_base$\r$\n$\r$\nClick Finish to close this wizard."

; Custom installation macro - runs during installation
!macro customInstall
  ; Create C:/malwa-crm directory structure
  DetailPrint "Creating Malwa CRM data directory structure..."
  
  ; Create main directory
  CreateDirectory "C:\malwa-crm"
  CreateDirectory "C:\malwa-crm\Data_base"
  
  ; Create module directories
  CreateDirectory "C:\malwa-crm\Data_base\accounts"
  CreateDirectory "C:\malwa-crm\Data_base\customer"
  CreateDirectory "C:\malwa-crm\Data_base\inventory"
  CreateDirectory "C:\malwa-crm\Data_base\jobs"
  CreateDirectory "C:\malwa-crm\Data_base\labour"
  CreateDirectory "C:\malwa-crm\Data_base\settings"
  CreateDirectory "C:\malwa-crm\Data_base\summary"
  CreateDirectory "C:\malwa-crm\Data_base\supplier"
  CreateDirectory "C:\malwa-crm\Data_base\vendors"
  CreateDirectory "C:\malwa-crm\Data_base\GoogleDrive_Sync"
  CreateDirectory "C:\malwa-crm\Data_base\Automatic Backups"
  
  DetailPrint "Directory structure created successfully!"
  DetailPrint "Data will be stored in: C:\malwa-crm\Data_base\"
!macroend

; Add registry entries for better Windows integration
Section "Registry Entries" SEC_REGISTRY
    WriteRegStr HKCU "Software\Malwa CRM" "InstallPath" "$INSTDIR"
    WriteRegStr HKCU "Software\Malwa CRM" "Version" "${VERSION}"
    WriteRegDWORD HKCU "Software\Malwa CRM" "Installed" 1
SectionEnd

; Create additional shortcuts
Section "Additional Shortcuts" SEC_SHORTCUTS
    CreateShortCut "$DESKTOP\Malwa CRM.lnk" "$INSTDIR\${PRODUCT_FILENAME}" "" "$INSTDIR\resources\app.asar.unpacked\build\icon.ico"
    CreateShortCut "$SMPROGRAMS\Malwa CRM\Malwa CRM.lnk" "$INSTDIR\${PRODUCT_FILENAME}" "" "$INSTDIR\resources\app.asar.unpacked\build\icon.ico"
    CreateShortCut "$SMPROGRAMS\Malwa CRM\Uninstall Malwa CRM.lnk" "$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe"
SectionEnd

; Cleanup on uninstall
Section "un.Registry Cleanup" SEC_UN_REGISTRY
    DeleteRegKey HKCU "Software\Malwa CRM"
SectionEnd