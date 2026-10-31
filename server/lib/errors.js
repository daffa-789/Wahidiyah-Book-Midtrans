/**
 * Galat layanan dengan status HTTP usulan.
 *
 * Service layer tidak boleh menyentuh `res`, jadi kegagalan yang memang bagian
 * dari aturan bisnis (input tidak valid, hak akses kurang, data tidak ada)
 * dilempar sebagai Error yang membawa `statusCode`. `fail()` di lib/http.js
 * menerjemahkannya menjadi respons, sehingga route cukup melempar ulang.
 */
export function createServiceError(message, { statusCode = 500, code = null, extra = null } = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  if (extra) error.extra = extra;
  return error;
}
