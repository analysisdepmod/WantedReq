using WantedRec.Models;

namespace WantedRec.Server.Controllers
{
    [Authorize(Roles = "RajManager,Admin,Tarmez")]
    [Route("api/[controller]")]
 
    [ApiController]
    public class NewsController(ApplicationDbContext context, IUser user,PythonService pythonService) : ControllerBase
    {
        private readonly ApplicationDbContext _context = context;
        private readonly PythonService _pythonService = pythonService;
        private readonly IUser user = user;

        // GET: api/News
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CrudNews>>> GetNewses()
        {

            var x = await (from a in _context.Newses

                           select new CrudNews
                           {
                          Details = a.Details,
                          DetailsEn = a.DetailsEn,
                          CanAll = a.CanAll,
                          Can=a.Can,
                          Id = a.Id,
                          ApplicationUserId =  a.ApplicationUserId,
                           }
                          ).ToListAsync();
            return x;
          
            
        }

        // GET: api/News/5
        [HttpGet("{id}")]
        public async Task<ActionResult<News>> GetNews(int id)
        { 
            var news = await _context.Newses.FindAsync(id);

            if (news == null)
            {
                return NotFound();
            }

            return news;
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
                               ApplicationUserId = GetNewserName(a.ApplicationUserId,_context).GetAwaiter().GetResult(),
                               ApplicationUserIdEn = GetNewserNameEn(a.ApplicationUserId,_context,_pythonService).GetAwaiter().GetResult(),
                           }
                    ).ToListAsync();
            return Ok(x);

        }

        private static async Task< string> GetNewserName(string applicationUserId, ApplicationDbContext context)
        {
            ApplicationUser? applicationUser = await context.ApplicationUser.FindAsync(applicationUserId);
            if (applicationUser !=null)
            {
                Rank? rank = await context.Ranks.FindAsync(applicationUser.RankId);
                if(rank !=null)
                return $"{rank.Name} / {applicationUser.PersonName}";
                return $"{applicationUser.PersonName}";
            }
            return string.Empty;
        }
        private static async Task<string> GetNewserNameEn(string applicationUserId, ApplicationDbContext context,PythonService pythonService1)
        {
            string Name = string.Empty;
            ApplicationUser? applicationUser = await context.ApplicationUser.FindAsync(applicationUserId);
            if (applicationUser != null)
            {
                Rank? rank = await context.Ranks.FindAsync(applicationUser.RankId);
                if (rank != null)
                    Name= $"{rank.Name} / {applicationUser.PersonName}";
                else
                Name= $"{applicationUser.PersonName}";
            }

            TranslatorDto translatorDto = new()
            {
                Text = Name,
                Sl="ar",
                Tl="en"
            };
            return pythonService1.RunTranslation(translatorDto);
            
        }
        // PUT: api/News/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutNews(int id, CrudNews news)
        {


            News news1 = new()
            {
                Id = id,
                ApplicationUserId = news.ApplicationUserId??"",
                Can = news.Can,
                Details = news.Details??"",
                DetailsEn = news.DetailsEn??""
            };
            if (id != news.Id)
            {
                return BadRequest();
            }

            _context.Entry(news1).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!NewsExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/News
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<News>> PostNews(CrudNews news)
        {

               news.ApplicationUserId =user.GetCurrentUserId().GetAwaiter().GetResult();

            News news1 = new()
            {
                ApplicationUserId = news.ApplicationUserId  /*"00271a83-77b9-46ee-a6d0-27ffe2222be9"*/,
                Can=news.Can,
                Details=news.Details??"",
                DetailsEn=news.DetailsEn??"",

            };
            _context.Newses.Add(news1);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log the exception or handle it in some way
                Console.WriteLine($"Error saving changes: {ex.Message}");
                // Optionally, rethrow the exception if needed
                // throw;
            }


            return CreatedAtAction("GetNews", new { id = news.Id }, news);
        }

        // DELETE: api/News/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNews(int id)
        {
            var news = await _context.Newses.FindAsync(id);
            if (news == null)
            {
                return NotFound();
            }

            _context.Newses.Remove(news);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool NewsExists(int id)
        {
            return _context.Newses.Any(e => e.Id == id);
        }

       


       
    }


   
}
