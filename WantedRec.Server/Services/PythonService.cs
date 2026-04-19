 
using Python.Runtime;
 

namespace WantedRec.Server.Services
{
    public class PythonService : IDisposable
    {

        public string Messege = string.Empty;
       
        public PythonService()
        {
            Messege = InitializePython();
            PythonEngine.BeginAllowThreads();
             
        }
        public   string InitializePython()
        {  

            try
            {
                PythonEngine.Initialize(); // Initialize the Python engine
           

                return "ok";
            }
            catch (Exception ex) 
            {
                if (ex is PythonException)
                {
                  return string.Empty;
                
                }
                return string.Empty;
                 
            }
        }
        public string RunTranslation(TranslatorDto dto)
        {
            
            try
            {
                
                using (Py.GIL()) // Acquire the GIL
                {
                    dynamic translator = Py.Import("translator"); // Import your Python module
                    try
                    {
                        var x = translator.run_translation(dto.Text, dto.Sl, dto.Tl);
                        return x;
                    }
                    catch (Exception ex)
                    {
                        
                            return string.Empty;
                        
                    }
                }
            }
            catch (Exception ex)
            {
                return string.Empty;
            }
            
       
        }


        public string RunTranslationGet(TranslatorDto dto)
        {
       
            try
            {
              
                using (Py.GIL())  
                {
                    dynamic translator = Py.Import("translator"); // Import your Python module
                    try
                    {
                        return translator.gettranslate(dto.Text, dto.Sl, dto.Tl);
                    
                    }
                    catch (Exception ex)
                    {

                        return string.Empty;

                    }
                }
            }
            catch (Exception ex)
            {
                return string.Empty;
            }


        }


        public void Dispose()
        {
            try
            {
                PythonEngine.Shutdown(); // Cleanup
            }
            catch (Exception ex) {
                Messege +=   string.Empty;

            }
         
        }
    }
}
