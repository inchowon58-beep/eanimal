' 콘솔(검은 창) 없이 기본 SEO 발행기 실행
Option Explicit
Dim sh, fso, dir, ok
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = dir

' 의존성 조용히 확인 (창 숨김)
sh.Run "cmd /c python -m pip install -q -r requirements.txt >nul 2>&1", 0, True

ok = False
On Error Resume Next
sh.Run "pythonw """ & dir & "\launcher.py""", 0, False
If Err.Number = 0 Then ok = True
Err.Clear
On Error GoTo 0

If Not ok Then
  ' pythonw 없을 때만 최소화 콘솔로 실행
  sh.Run "cmd /c start "" /MIN python """ & dir & "\launcher.py""", 0, False
End If
