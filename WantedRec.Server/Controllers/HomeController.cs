using WantedRec.Models;
using System.Linq.Dynamic.Core;

namespace WantedRec.Server.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class HomeController(ApplicationDbContext context, IWebHostEnvironment webHostEnvironment, IUser user, PythonService pythonService) : ControllerBase
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IUser user = user;
        private readonly IWebHostEnvironment _webHostEnvironment = webHostEnvironment;
        private readonly PythonService _pythonService = pythonService;



        [HttpGet("GetSpniPdfs")]
        public async Task<ActionResult<IEnumerable<SpniPdf>>> GetSpniPdfs()
        {
            var x = await (from a in _context.SpniPdfs

                           select new SpniPdf
                           {
                               Color = a.Color,
                               Description = a.Description ?? "",
                               DescriptionEn = a.DescriptionEn ?? "",
                               Id = a.Id,
                               Name = a.Name,
                               NameEn = a.NameEn,
                               PdfFileName = a.PdfFileName,
                               sort = a.sort

                           }
                    ).OrderBy(i => i.sort).ToListAsync();
            return x;
        }


        [HttpGet("getImages")]
    public async Task<ActionResult<List<ImagesDto>>> GetImages()
    {
        
        var x = await (from a in _context.Imagess
                        
                       select new ImagesDto
                       {
                           Color = a.Color,
                           Description = a.Description ?? "-",
                           DescriptionEn = a.DescriptionEn ?? "-",
                           Id = a.Id,
                           Name = a.Name,
                           NameEn = a.NameEn,
                           ImageFileName = a.ImageFileName,
                           Sort = a.Sort,
                           CreatedDate = a.CreatedDate
                       }).OrderBy(i => i.Sort).ToListAsync();
                  
        return x;



    }
        [HttpGet("GetAllNews")]
        public async Task<ActionResult<News>> GetAllNews()
        {
            var x = await (from a in _context.Newses

                           select new News
                           {
                               Details = a.Details,
                               DetailsEn = a.DetailsEn,
                               CanAll = a.CanAll,
                               Can = a.Can,
                               Id = a.Id,
                               ApplicationUserId = GetNewserName(a.ApplicationUserId, _context).GetAwaiter().GetResult(),
                               ApplicationUserIdEn = GetNewserNameEn(a.ApplicationUserId, _context, _pythonService).GetAwaiter().GetResult(),
                           }
                    ).ToListAsync();
            return Ok(x);

        }
        private static async Task<string> GetNewserName(string applicationUserId, ApplicationDbContext context)
        {
            ApplicationUser? applicationUser = await context.ApplicationUser.FindAsync(applicationUserId);
            if (applicationUser != null)
            {
                Rank? rank = await context.Ranks.FindAsync(applicationUser.RankId);
                if (rank != null)
                    return $"{rank.Name} / {applicationUser.PersonName}";
                return $"{applicationUser.PersonName}";
            }
            return string.Empty;
        }
        private static async Task<string> GetNewserNameEn(string applicationUserId, ApplicationDbContext context, PythonService pythonService1)
        {
            string Name = string.Empty;
            ApplicationUser? applicationUser = await context.ApplicationUser.FindAsync(applicationUserId);
            if (applicationUser != null)
            {
                Rank? rank = await context.Ranks.FindAsync(applicationUser.RankId);
                if (rank != null)
                    Name = $"{rank.Name} / {applicationUser.PersonName}";
                else
                    Name = $"{applicationUser.PersonName}";
            }

            TranslatorDto translatorDto = new()
            {
                Text = Name,
                Sl = "ar",
                Tl = "en"
            };
            return pythonService1.RunTranslation(translatorDto);

        }
    }
}
