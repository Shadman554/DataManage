$npmPath = "C:\Users\NAMI\AppData\Roaming\npm"

# Add to current session
$env:Path += ";$npmPath"

# Add to user environment variables
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$npmPath", "User")
