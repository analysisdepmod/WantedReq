using Python.Runtime;
using System;
using System.IO;

namespace WantedRec.Server.Services
{
    public class PythonService : IDisposable
    {
        private static readonly object _lock = new();
        private static bool _initialized = false;
        private static bool _allowThreadsCalled = false;

        public string Message { get; private set; } = string.Empty;

        public PythonService()
        {
            Message = InitializePython();
        }

        public string InitializePython()
        {
            lock (_lock)
            {
                if (_initialized)
                    return "ok";

                try
                {
                    // عدل هذا حسب نسخة البايثون عندك
                    var pyHome = @"C:\Python311";
                    var pyDll = Path.Combine(pyHome, "python311.dll");

                    if (!File.Exists(pyDll))
                        return $"Python DLL not found: {pyDll}";

                    Runtime.PythonDLL = pyDll;
                    Environment.SetEnvironmentVariable("PYTHONNET_PYDLL", pyDll);
                    Environment.SetEnvironmentVariable("PYTHONHOME", pyHome);

                    var dllsPath = Path.Combine(pyHome, "DLLs");
                    var libPath = Path.Combine(pyHome, "Lib");

                    Environment.SetEnvironmentVariable(
                        "PATH",
                        pyHome + ";" + dllsPath + ";" + libPath + ";" +
                        (Environment.GetEnvironmentVariable("PATH") ?? string.Empty)
                    );

                    PythonEngine.Initialize();

                    if (!_allowThreadsCalled)
                    {
                        PythonEngine.BeginAllowThreads();
                        _allowThreadsCalled = true;
                    }

                    _initialized = true;
                    return "ok";
                }
                catch (Exception ex)
                {
                    return ex.ToString();
                }
            }
        }

        public string RunTranslation(TranslatorDto dto)
        {
            try
            {
                EnsureInitialized();

                using (Py.GIL())
                {
                    AddCurrentDirectoryToPythonPath();

                    dynamic translator = Py.Import("translator");
                    var result = translator.run_translation(dto.Text, dto.Sl, dto.Tl);

                    return result?.ToString() ?? string.Empty;
                }
            }
            catch (Exception ex)
            {
                return ex.ToString();
            }
        }

        public string RunTranslationGet(TranslatorDto dto)
        {
            try
            {
                EnsureInitialized();

                using (Py.GIL())
                {
                    AddCurrentDirectoryToPythonPath();

                    dynamic translator = Py.Import("translator");
                    var result = translator.gettranslate(dto.Text, dto.Sl, dto.Tl);

                    return result?.ToString() ?? string.Empty;
                }
            }
            catch (Exception ex)
            {
                return ex.ToString();
            }
        }

        private static void EnsureInitialized()
        {
            if (!_initialized)
                throw new InvalidOperationException("Python engine is not initialized.");
        }

        private static void AddCurrentDirectoryToPythonPath()
        {
            dynamic sys = Py.Import("sys");
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;

            if (!(bool)sys.path.__contains__(baseDir))
                sys.path.append(baseDir);

            string pyScriptsDir = Path.Combine(baseDir, "PythonScripts");
            if (Directory.Exists(pyScriptsDir) && !(bool)sys.path.__contains__(pyScriptsDir))
                sys.path.append(pyScriptsDir);
        }

        public void Dispose()
        {
            // لا تطفي Python هنا إذا الخدمة مو Singleton
            // خليها فارغة أو طفّيها فقط عند إغلاق التطبيق
        }

        public static void ShutdownPython()
        {
            lock (_lock)
            {
                if (_initialized)
                {
                    PythonEngine.Shutdown();
                    _initialized = false;
                    _allowThreadsCalled = false;
                }
            }
        }
    }
}