

namespace WantedRec.Server.Controllers
{
    //[Authorize(Roles = "RajManager,Admin")]
    [Route("api/[controller]")]
    [ApiController]
 
    public class ImagesController(ApplicationDbContext context, IWebHostEnvironment webHostEnvironment, IUser user) : ControllerBase
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IUser user = user;
        private readonly IWebHostEnvironment _webHostEnvironment = webHostEnvironment;

        // GET: api/Images
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ImagesDto>>> GetImages()
        {
             var ApplicationUserId = user.GetCurrentUserId().GetAwaiter().GetResult();
            var x = await (from a in _context.Imagess
                           where a.ApplicationUserId == ApplicationUserId
                           select new ImagesDto
                           {
                             Color = a.Color,
                             Description = a.Description??"-",
                             DescriptionEn = a.DescriptionEn??"-",
                             Id = a.Id,
                             Name = a.Name,
                             NameEn = a.NameEn,
                             ImageFileName = a.ImageFileName,
                             Sort = a.Sort,
                             CreatedDate = a.CreatedDate,
                             UserId=a.ApplicationUserId,
                             UserName=_context.ApplicationUser.Where(i=>i.Id==a.ApplicationUserId).Select(i=>i.PersonName).FirstOrDefault()??"",
                            // UnitName=_context.Units.Where(i=>i.Ur_no==a.ApplicationUserId).Select(i=>i.PersonName).FirstOrDefault()??"",

                             
                           }
                      ).OrderBy(i => i.Sort).ToListAsync();
            return x;

 

        }

        // GET: api/Images/5
        [HttpGet("{id}")]
        public async Task<ActionResult<bool>> GetImages(int id)
        {
            var images = await _context.Imagess.FindAsync(id);

            if (images == null)
            {
                return false;
            }

            return true;
        }

        // PUT: api/Images/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<bool> PutImages(int id, ImagesDto image)
        {
            var ApplicationUserId = user.GetCurrentUserId().GetAwaiter().GetResult();
            string fileName = string.Empty;
            if (id != image.Id)
            {
                return false;
            }

            if (ModelState.IsValid)
            {
                try
                {
                    Images? images=await _context.Imagess.FindAsync(id);
                    if (images == null)
                    {
                        return false;
                    }
                    if (image.file != null)
                    {

                        fileName = "/images/" + image.file.FileName;
                        if (!Directory.Exists(_webHostEnvironment.WebRootPath + "/images"))
                        {
                            Directory.CreateDirectory(_webHostEnvironment.WebRootPath + "/images/");
                        }
                        using FileStream filestream = System.IO.File.Create(_webHostEnvironment.WebRootPath + fileName);
                        image.file.CopyTo(filestream);
                        filestream.Flush();


                        image.ImageFileName = fileName;
                    }
                     

                    images.Sort = image.Sort;
                    images.ApplicationUserId = ApplicationUserId;
                    images.Description = image.Description;
                    images.DescriptionEn = image.DescriptionEn;
                    images.Color    = image.Color;
                    images.Name = image.Name;
                    images.NameEn = image.NameEn;
                    images.CreatedDate = image.CreatedDate;
                    images.ImageFileName = image.ImageFileName;

                    _context.Update(images);
                       return   await _context.SaveChangesAsync()>0;
                




                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!ContextsImageExists(image.Id))
                    {
                        return false;
                    }
                    else
                    {
                        throw;
                    }
                }

            }
            return false;
        }
        private bool ContextsImageExists(int id)
        {
            return (_context.Imagess?.Any(e => e.Id == id)).GetValueOrDefault();
        }

        // POST: api/Images
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
       

      
        [HttpPost]
        public async Task<IActionResult> PostImages(ImagesDto image) /*, string Description, string color  ,int sort*/
        {

            var ApplicationUserId = user.GetCurrentUserId().GetAwaiter().GetResult();
            string fileName = string.Empty;
            if (ModelState.IsValid)
            {
                if (image.file == null)
                {

                    return BadRequest();
                }
                else
                {

                    fileName = "/images/" + image.file.FileName;
                    if (!Directory.Exists(_webHostEnvironment.WebRootPath + "/images"))
                    {
                        Directory.CreateDirectory(_webHostEnvironment.WebRootPath + "/images/");
                    }
                    using FileStream filestream = System.IO.File.Create(_webHostEnvironment.WebRootPath + fileName);
                    image.file.CopyTo(filestream);
                    filestream.Flush();
                    try
                    {
                        image.ImageFileName = fileName;
                        Images images = new();
                        {
                            images.Name = image.Name;
                            images.NameEn = image.NameEn;
                            images.Description = image.Description??"_";
                            images.DescriptionEn = image.DescriptionEn??"_";
                            images.Color = image.Color;
                            images.Id = image.Id;
                            images.Sort = image.Sort;
                            images.ImageFileName = image.ImageFileName;
                            images.CreatedDate = DateTime.Now;
                            images.ApplicationUserId= ApplicationUserId;
                        }
                       
                        _context.Imagess.Add(images);
                        return Ok(
                            await _context.SaveChangesAsync()>0);

                    }
                    catch (Exception ex) {
                        return Ok(false); }


         


                }

            }

            return Ok(image);



        }

        // DELETE: api/Images/5
        [HttpDelete("{id}")]
        public async Task<bool> DeleteImages(int id)
        {


            var images = await _context.Imagess.FindAsync(id);
            if (images == null)
            {
                return false;
            }

            _context.Imagess.Remove(images);
            await _context.SaveChangesAsync();

            return true;
        }

        
    }
}
