import React, { useState, useEffect, useRef } from 'react';
import {
  FolderLock,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Eye,
  Download,
  Plus,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { FactumfluxClient, WalletDocument } from '@factumflux/api-client';

interface DocumentWalletViewProps {
  client: FactumfluxClient;
  onLinkToQualification?: () => void;
}

const DOCUMENT_TYPES_CATALOG = [
  { code: 'FICHA_RUC', name: 'Ficha RUC SUNAT Actualizada', level: 1 },
  { code: 'VIGENCIA_PODER', name: 'Vigencia de Poder Registral (SUNARP)', level: 1 },
  { code: 'DNI_REP_LEGAL', name: 'Documento de Identidad del Representante Legal', level: 1 },
  { code: 'ESTADO_BANCARIO_CCI', name: 'Certificado Bancario de Titularidad y CCI', level: 1 },
  { code: 'ESTADOS_FINANCIEROS', name: 'Estados Financieros del Último Ejercicio', level: 2 },
  { code: 'CARTAS_REFERENCIA', name: 'Cartas de Referencia Comercial', level: 2 },
  { code: 'DJ_NO_INHABILITADO', name: 'Declaración Jurada de No Inhabilitación', level: 2 },
  { code: 'FORM_DEBIDA_DILIGENCIA', name: 'Formulario de Debida Diligencia LA/FT y Anticorrupción', level: 2 },
  { code: 'SCTR_SALUD_PENSION', name: 'Póliza SCTR Salud y Pensión Vigente', level: 3 },
  { code: 'SEGURO_VIDA_LEY', name: 'Póliza de Seguro Vida Ley', level: 3 },
  { code: 'POLITICA_REGLAMENTO_SST', name: 'Política y Reglamento Interno de SST (RISST)', level: 3 },
  { code: 'IPERC_LINEA_BASE', name: 'Matriz IPERC de Línea Base', level: 3 },
];

export const DocumentWalletView: React.FC<DocumentWalletViewProps> = ({
  client,
  onLinkToQualification,
}) => {
  const [documents, setDocuments] = useState<WalletDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDO'>('ALL');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedTypeCode, setSelectedTypeCode] = useState(DOCUMENT_TYPES_CATALOG[0].code);
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Document Preview modal state
  const [previewDoc, setPreviewDoc] = useState<WalletDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listSupplierWalletDocuments();
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error cargando billetera documental:', err);
      setError(err.message || 'Error al conectar con la billetera documental');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [client]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Debe seleccionar un archivo PDF');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type_code', selectedTypeCode);
      if (issueDate) formData.append('issue_date', issueDate);
      if (expiryDate) formData.append('expiry_date', expiryDate);

      await client.uploadSupplierWalletDocument(formData);

      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setIssueDate('');
      setExpiryDate('');
      await loadDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Error subiendo archivo a la billetera');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_type_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (DOCUMENT_TYPES_CATALOG.find((c) => c.code === doc.document_type_code)?.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VIGENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F4F2] text-[#0A7469] border border-[#0A7469]/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Vigente
          </span>
        );
      case 'POR_VENCER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDF3DC] text-[#8A5A00] border border-[#F5A623]/30">
            <Clock className="w-3.5 h-3.5" />
            Por Vencer
          </span>
        );
      case 'VENCIDO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDE8E8] text-[#9B1C1C] border border-[#E02424]/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Vencido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getDocTypeName = (code: string) => {
    const item = DOCUMENT_TYPES_CATALOG.find((c) => c.code === code);
    return item ? item.name : code;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E7EE] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#E8F4F2] text-[#0A7469] rounded-xl">
            <FolderLock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B2545]">Billetera de Documentos Global</h1>
            <p className="text-xs text-[#5B6B7F] mt-0.5">
              Repositorio maestro propio de tu empresa. Sube tus documentos una sola vez con integridad criptográfica SHA-256 para compartirlos con todos tus clientes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onLinkToQualification && (
            <button
              onClick={onLinkToQualification}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0B2545] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#0A7469]" />
              Ver Homologación
            </button>
          )}

          <button
            onClick={() => {
              setUploadError(null);
              setSelectedFile(null);
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2 bg-[#0A7469] hover:bg-[#075A52] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            + Subir Documento Maestro
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E7EE] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#5B6B7F] block">Documentos Vigentes</span>
            <span className="text-2xl font-bold text-[#0A7469] block mt-1">
              {documents.filter((d) => d.status === 'VIGENTE').length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8F4F2] flex items-center justify-center text-[#0A7469]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E7EE] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#5B6B7F] block">Por Vencer (&lt;30 días)</span>
            <span className="text-2xl font-bold text-[#8A5A00] block mt-1">
              {documents.filter((d) => d.status === 'POR_VENCER').length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FDF3DC] flex items-center justify-center text-[#8A5A00]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E7EE] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#5B6B7F] block">Vencidos / Requieren Renovación</span>
            <span className="text-2xl font-bold text-[#9B1C1C] block mt-1">
              {documents.filter((d) => d.status === 'VENCIDO').length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FDE8E8] flex items-center justify-center text-[#9B1C1C]">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E7EE] shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#5B6B7F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o tipo de documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:border-[#0A7469] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#5B6B7F]" />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] focus:outline-none focus:border-[#0A7469] font-medium"
          >
            <option value="ALL">Todos los estados</option>
            <option value="VIGENTE">Solo Vigentes</option>
            <option value="POR_VENCER">Por Vencer</option>
            <option value="VENCIDO">Vencidos</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-[#E2E7EE] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-[#5B6B7F]">
            <div className="w-8 h-8 border-3 border-[#0A7469] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Cargando documentos de la billetera...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 space-y-3">
            <AlertTriangle className="w-8 h-8 mx-auto text-rose-500" />
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={loadDocuments}
              className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              Reintentar
            </button>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-[#5B6B7F] space-y-3">
            <FolderLock className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-[#0B2545]">Billetera sin documentos cargados</h3>
            <p className="text-xs max-w-sm mx-auto text-[#5B6B7F]">
              Aún no has incorporado documentos maestros. Sube tus documentos principales para acelerar la homologación con tus clientes corporativos.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-[#0A7469] text-white rounded-xl text-xs font-semibold hover:bg-[#075A52] transition-colors"
            >
              Subir mi primer documento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E7EE] bg-slate-50/70 text-[#5B6B7F] font-semibold uppercase">
                  <th className="py-3 px-4">Tipo de Documento</th>
                  <th className="py-3 px-4">Nombre de Archivo</th>
                  <th className="py-3 px-4">Emisión / Vencimiento</th>
                  <th className="py-3 px-4">Integridad SHA-256</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7EE]">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#0B2545]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#0A7469] flex-shrink-0" />
                        <span>{getDocTypeName(doc.document_type_code)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div className="max-w-[200px] truncate" title={doc.file_name}>
                        {doc.file_name}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>Emisión: {doc.issue_date || 'N/D'}</div>
                      <div className="font-semibold text-slate-800">
                        Vence: {doc.expiry_date || 'Permanente'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      <span title={doc.sha256_hash}>
                        {doc.sha256_hash.substring(0, 12)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded-lg text-[#5B6B7F] hover:text-[#0A7469] hover:bg-[#E8F4F2] transition-colors"
                          title="Visualizar documento en pantalla"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={client.getWalletDocumentContentUrl(doc.id)}
                          download={doc.file_name}
                          className="p-1.5 rounded-lg text-[#5B6B7F] hover:text-[#0B2545] hover:bg-slate-100 transition-colors"
                          title="Descargar copia del archivo"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: SUBIR DOCUMENTO A LA BILLETERA ─────────────────────────── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E2E7EE] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E7EE] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-[#0A7469]" />
                <h3 className="text-sm font-bold text-[#0B2545]">Subir Documento a Billetera Global</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Tipo de Documento Maestro
                </label>
                <select
                  value={selectedTypeCode}
                  onChange={(e) => setSelectedTypeCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
                >
                  {DOCUMENT_TYPES_CATALOG.map((item) => (
                    <option key={item.code} value={item.code}>
                      [Nivel {item.level}] {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Opcional para docs permanentes</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Archivo PDF
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-3 border-2 border-dashed border-[#E2E7EE] hover:border-[#0A7469] rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-1.5 transition-colors"
                >
                  <UploadCloud className="w-6 h-6 text-[#0A7469]" />
                  <span className="text-xs font-semibold text-[#0B2545]">
                    {selectedFile ? selectedFile.name : 'Haga clic para seleccionar archivo PDF'}
                  </span>
                  <span className="text-[10px] text-[#5B6B7F]">Formato PDF hasta 10 MB</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E7EE] text-[#5B6B7F] rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-4 py-2 bg-[#0A7469] text-white rounded-xl text-xs font-semibold hover:bg-[#075A52] disabled:opacity-50 transition-colors"
                >
                  {isUploading ? 'Guardando...' : 'Guardar en Billetera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VISOR DE DOCUMENTO PDF EMBEBIDO ───────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] border border-[#E2E7EE] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b border-[#E2E7EE] bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0A7469]" />
                <h3 className="text-xs font-bold text-[#0B2545]">
                  {getDocTypeName(previewDoc.document_type_code)}: {previewDoc.file_name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={client.getWalletDocumentContentUrl(previewDoc.id)}
                  download={previewDoc.file_name}
                  className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-[#0B2545] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-2 overflow-hidden">
              <iframe
                src={client.getWalletDocumentContentUrl(previewDoc.id)}
                title={previewDoc.file_name}
                className="w-full h-full border-0 rounded-xl bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
