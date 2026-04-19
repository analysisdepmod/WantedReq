namespace WantedRec.Server.Models
{
    public class Posted
    {
        public int Id { get; set; }
        [Required]
        public string ApplicationUserId { get; set; } = null!;
        public ApplicationUser ApplicationUsers { get; set; } = null!;

        [Required]
        public string Action { get; set; } = null!;
        public string ActionEn { get; set; } = null!;

        [Required]
        public DateTime PostedDate { get; set; }

        [Required]
        public int Att_pk { get; set;}
        public int WhatAction { get; set;}
        [Required]
        public string Att_Controller_Name { get; set; } = null!;

    }
}
