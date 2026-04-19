
 

namespace WantedRec.Server.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TranslationController : ControllerBase
    {


        private readonly PythonService _pythonService;

        public TranslationController(PythonService pythonService)
        {
            _pythonService = pythonService;
        }

        [HttpPost("translate")]
        public IActionResult Translate(TranslatorDto dto)
        {
            try
            {


               
                    var translatedText = _pythonService.RunTranslation(dto);
                    return Ok(translatedText.TrimEnd('.'));
                

               
            }
            catch (Exception ex) 
            {
                return  Ok(string.Empty);
            }
          
        }
        [HttpGet("Gettranslate")]
        public IActionResult GetTranslate(string text,string sl ,string tl)
        {
            try
            {
                TranslatorDto dto = new()
                {
                    Text=text,
                    Sl=sl,
                    Tl=tl,
                };
                    var translatedText = _pythonService.RunTranslationGet(dto);
                    return Ok(translatedText.TrimEnd('.'));
            }
            catch (Exception ex) 
            {
                return  Ok(string.Empty);
            }
          
        }

    }
}

 