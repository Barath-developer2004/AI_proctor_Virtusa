@REM Maven Wrapper startup batch script
@REM ---------------------------------------------------------------------------
@setlocal

set MAVEN_PROJECTBASEDIR=%~dp0
set WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar
set WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar

@REM Download maven-wrapper.jar if not present
if not exist "%WRAPPER_JAR%" (
    powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%'"
)

set MAVEN_CMD_LINE_ARGS=%*
java -jar "%WRAPPER_JAR%" %MAVEN_CMD_LINE_ARGS%
