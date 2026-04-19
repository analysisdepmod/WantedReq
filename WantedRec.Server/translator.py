import asyncio
from concurrent.futures import ThreadPoolExecutor
import argostranslate.package
import argostranslate.translate

# Load Argos Translate packages
argostranslate.package.install_from_path('en_ar.argosmodel')
argostranslate.package.install_from_path('ar_en.argosmodel')

def gettranslate(text, source_lang, target_lang):
    return argostranslate.translate.translate(text, source_lang, target_lang)

def synchronous_translate(text, source_lang, target_lang):
    translated_text = argostranslate.translate.translate(text, source_lang, target_lang)
    return translated_text
  

async def async_translate(text, source_lang, target_lang):
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        # Run the synchronous function in a separate thread
        translated_text = await loop.run_in_executor(executor, synchronous_translate, text, source_lang, target_lang)
    return translated_text

def run_translation(text, source_lang, target_lang):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)  # Set the new event loop
    return loop.run_until_complete(async_translate(text, source_lang, target_lang))


     
  