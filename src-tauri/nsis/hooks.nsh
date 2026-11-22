!macro NSIS_HOOK_POSTINSTALL
  IfFileExists "$INSTDIR\resources\WebView2Loader.dll" 0 +2
    CopyFiles /SILENT "$INSTDIR\resources\WebView2Loader.dll" "$INSTDIR\WebView2Loader.dll"

  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Musix" '"$INSTDIR\musix.exe" --autostart'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  Delete "$INSTDIR\WebView2Loader.dll"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Musix"
!macroend
