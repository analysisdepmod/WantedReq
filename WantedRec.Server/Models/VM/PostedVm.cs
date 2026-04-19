namespace WantedRec.Server.Models.VM
{
    public class PostedVm
    {
        public int Id { get; set; }
        public string? Action { get; set; }
        public string? ActionEn { get; set; }
        public DateTime Whenseen { get; set; }
        public bool Colorseen { get; set; }
        public DateTime DateNow { get; set; }
        public int Att_pk { get; set; }
        public int WhatAction { get; set; }

        public string? Att_Controller_Name { get; set; }
    }
}
