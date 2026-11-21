package expo.modules.mltranslate

import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.TranslateRemoteModel
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Translates text on the phone with Google ML Kit. A language pack (about 30 MB) is downloaded once; after that no internet is needed
// and the text never leaves the phone. Languages are two-letter codes such as "zh", "id", "ar".
class MlTranslateModule : Module() {
  private fun options(from: String, to: String): TranslatorOptions? {
    val a = TranslateLanguage.fromLanguageTag(from)
    val b = TranslateLanguage.fromLanguageTag(to)
    if (a == null || b == null) return null
    return TranslatorOptions.Builder().setSourceLanguage(a).setTargetLanguage(b).build()
  }

  override fun definition() = ModuleDefinition {
    Name("MlTranslate")

    // Language packs already on the phone, for example ["en", "zh"].
    AsyncFunction("downloaded") { promise: Promise ->
      try {
        RemoteModelManager.getInstance().getDownloadedModels(TranslateRemoteModel::class.java)
          .addOnSuccessListener { models -> promise.resolve(models.map { it.language }) }
          .addOnFailureListener { promise.resolve(emptyList<String>()) }
      } catch (e: Throwable) {
        promise.resolve(emptyList<String>())
      }
    }

    // Downloads the pack for one language (and English, which every translation goes through). Resolves true when it is ready.
    AsyncFunction("download") { lang: String, promise: Promise ->
      try {
        val o = options(lang, "en")
        if (o == null) {
          promise.resolve(false)
        } else {
          val t = Translation.getClient(o)
          t.downloadModelIfNeeded(DownloadConditions.Builder().build())
            .addOnSuccessListener { t.close(); promise.resolve(true) }
            .addOnFailureListener { t.close(); promise.resolve(false) }
        }
      } catch (e: Throwable) {
        promise.resolve(false)
      }
    }

    // Removes the pack for one language to free space. English stays.
    AsyncFunction("remove") { lang: String, promise: Promise ->
      try {
        val tag = TranslateLanguage.fromLanguageTag(lang)
        if (tag == null || tag == TranslateLanguage.ENGLISH) {
          promise.resolve(false)
        } else {
          RemoteModelManager.getInstance().deleteDownloadedModel(TranslateRemoteModel.Builder(tag).build())
            .addOnSuccessListener { promise.resolve(true) }
            .addOnFailureListener { promise.resolve(false) }
        }
      } catch (e: Throwable) {
        promise.resolve(false)
      }
    }

    // Translates one piece of text. Rejects when a pack is missing, so the caller can fall back to the original text.
    AsyncFunction("translate") { text: String, from: String, to: String, promise: Promise ->
      try {
        val o = options(from, to)
        if (o == null) {
          promise.reject("E_LANG", "Unsupported language", null)
        } else {
          val t = Translation.getClient(o)
          t.translate(text)
            .addOnSuccessListener { r -> t.close(); promise.resolve(r) }
            .addOnFailureListener { e -> t.close(); promise.reject("E_TRANSLATE", e.message ?: "Could not translate", e) }
        }
      } catch (e: Throwable) {
        promise.reject("E_TRANSLATE", e.message ?: "Could not translate", e)
      }
    }
  }
}
