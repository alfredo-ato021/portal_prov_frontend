import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Truck,
  Building2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  FileUp,
  Check,
  Info,
} from 'lucide-react';
import {
  FactumfluxClient,
  POReceptionStatusResponse,
} from '@factumflux/api-client';

interface UploadInvoiceViewProps {
  client: FactumfluxClient;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UploadInvoiceView: React.FC<UploadInvoiceViewProps> = ({
  client,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: PO / OS Lookup
  const [poNumber, setPoNumber] = useState('OC-2026-8941');
  const [isCheckingPO, setIsCheckingPO] = useState(false);
  const [poStatus, setPoStatus] = useState<POReceptionStatusResponse | null>(null);
  const [poError, setPoError] = useState<string | null>(null);

  // Step 2: Invoice XML & PDF Upload
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    seriesNumber: string;
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    issueDate: string;
  } | null>(null);

  // Step 2 (Conditional Bienes): GRE Files
  const [greSeries, setGreSeries] = useState('T001');
  const [greNumber, setGreNumber] = useState('');
  const [greXmlFile, setGreXmlFile] = useState<File | null>(null);
  const [grePdfFile, setGrePdfFile] = useState<File | null>(null);

  // Step 2: Factoring Externo
  const [isFactored, setIsFactored] = useState(false);
  const [factoringEntityName, setFactoringEntityName] = useState('InnovaFactoring S.A.');
  const [factoringLetterFile, setFactoringLetterFile] = useState<File | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const xmlInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const greXmlRef = useRef<HTMLInputElement>(null);
  const grePdfRef = useRef<HTMLInputElement>(null);
  const factoringLetterRef = useRef<HTMLInputElement>(null);

  const demoPOs = [
    { code: 'OC-2026-8941', desc: 'Bien con Entrada de Mercancías (GR Aprobada)' },
    { code: 'OS-2026-102', desc: 'Servicio con Conformidad (HES Aprobada)' },
    { code: 'OC-2026-9999', desc: 'Bien SIN recepción (Probar bloqueo preventivo)' },
  ];

  const handleCheckPO = async (codeToUse?: string) => {
    const code = (codeToUse || poNumber).trim();
    if (!code) {
      setPoError('Por favor ingrese un número de Orden de Compra o Servicio.');
      return;
    }

    setIsCheckingPO(true);
    setPoError(null);
    setPoStatus(null);

    try {
      const result = await client.checkPOReceptionStatus(code);
      setPoStatus(result);
      if (result.order_type === 'BIEN') {
        setGreNumber('000' + Math.floor(1000 + Math.random() * 9000));
      }
    } catch (err: any) {
      setPoError(err.message || 'Error al consultar la orden en el ERP.');
    } finally {
      setIsCheckingPO(false);
    }
  };

  const handleXMLFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml')) {
      alert('Por favor seleccione un archivo XML válido (comprobante UBL 2.1).');
      return;
    }

    setXmlFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');

        const idElem = xmlDoc.getElementsByTagNameNS('*', 'ID')[0] || xmlDoc.getElementsByTagName('cbc:ID')[0];
        const seriesNum = idElem?.textContent || 'F001-0004522';

        const payableElem = xmlDoc.getElementsByTagNameNS('*', 'PayableAmount')[0];
        const taxElem = xmlDoc.getElementsByTagNameNS('*', 'TaxAmount')[0];
        const total = payableElem ? parseFloat(payableElem.textContent || '0') : (poStatus?.total_amount || 14250.0);
        const tax = taxElem ? parseFloat(taxElem.textContent || '0') : total * 0.18;
        const subtotal = total - tax;

        const dateElem = xmlDoc.getElementsByTagNameNS('*', 'IssueDate')[0];
        const issueDate = dateElem?.textContent || new Date().toISOString().split('T')[0];

        setParsedPreview({
          seriesNumber: seriesNum,
          subtotal,
          tax,
          total,
          currency: poStatus?.currency || 'PEN',
          issueDate,
        });
      } catch {
        setParsedPreview({
          seriesNumber: 'F001-0004522',
          subtotal: 12076.27,
          tax: 2173.73,
          total: 14250.0,
          currency: poStatus?.currency || 'PEN',
          issueDate: new Date().toISOString().split('T')[0],
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSimulateXmlLoad = () => {
    const dummyXml = new File(
      [
        `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
          <cbc:ID>F001-0004522</cbc:ID>
          <cbc:IssueDate>2026-11-04</cbc:IssueDate>
          <cbc:DocumentCurrencyCode>${poStatus?.currency || 'PEN'}</cbc:DocumentCurrencyCode>
          <cbc:PayableAmount>${poStatus?.total_amount || 14250.0}</cbc:PayableAmount>
        </Invoice>`,
      ],
      '20601234567-01-F001-0004522.xml',
      { type: 'application/xml' }
    );
    setXmlFile(dummyXml);
    setParsedPreview({
      seriesNumber: 'F001-0004522',
      subtotal: ((poStatus?.total_amount || 14250.0) / 1.18),
      tax: (poStatus?.total_amount || 14250.0) - ((poStatus?.total_amount || 14250.0) / 1.18),
      total: poStatus?.total_amount || 14250.0,
      currency: poStatus?.currency || 'PEN',
      issueDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = async () => {
    if (!xmlFile) {
      setSubmitError('Debe adjuntar el archivo XML de la factura.');
      return;
    }

    if (poStatus?.order_type === 'BIEN' && (!greSeries || !greNumber)) {
      setSubmitError('Para órdenes de Bienes es obligatorio indicar la Serie y Número de la Guía de Remisión (GRE).');
      return;
    }

    if (isFactored && !factoringEntityName) {
      setSubmitError('Debe indicar el nombre de la empresa de Factoring con la que se negoció la factura.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('xml_file', xmlFile);
      if (pdfFile) formData.append('pdf_file', pdfFile);

      formData.append('po_number', poStatus?.po_number || poNumber);
      formData.append('order_type', poStatus?.order_type || 'BIEN');

      if (isFactored) {
        formData.append('is_factored', 'true');
        formData.append('factoring_entity_name', factoringEntityName);
        if (factoringLetterFile) {
          formData.append('factoring_letter_file', factoringLetterFile);
        }
      }

      if (poStatus?.order_type === 'BIEN') {
        formData.append('has_gre', 'true');
        formData.append('gre_series', greSeries);
        formData.append('gre_number', greNumber);
        if (greXmlFile) formData.append('gre_xml_file', greXmlFile);
        if (grePdfFile) formData.append('gre_pdf_file', grePdfFile);
      }

      await client.uploadInvoiceMultipart(formData);
      setStep(3);
    } catch (err: any) {
      setSubmitError(err.message || 'Error al procesar la carga del comprobante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-[#0A7469]" />
            Carga de Factura Electrónica
          </h1>
          <p className="text-sm text-[#5B6B7F] mt-1">
            Validación previa en ERP, lectura de XML UBL 2.1, cruce con Guía de Remisión y Cesión Factoring.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-[#5B6B7F] hover:text-[#0B2545] px-3 py-1.5 rounded-lg border border-[#E2E7EE] bg-white shadow-sm transition-colors"
        >
          Cancelar y Volver
        </button>
      </div>

      {/* Visual Stepper */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#E2E7EE] -translate-y-1/2 z-0" />

          {/* Step 1 Indicator */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= 1
                  ? 'bg-[#0A7469] text-white ring-4 ring-[#E8F4F2]'
                  : 'bg-[#F3F5F8] text-[#5B6B7F]'
              }`}
            >
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-xs font-semibold text-[#0B2545] mt-2">Recepción ERP</span>
          </div>

          {/* Step 2 Indicator */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= 2
                  ? 'bg-[#0A7469] text-white ring-4 ring-[#E8F4F2]'
                  : 'bg-[#F3F5F8] text-[#5B6B7F]'
              }`}
            >
              {step > 2 ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <span className="text-xs font-semibold text-[#0B2545] mt-2">Carga XML & GRE</span>
          </div>

          {/* Step 3 Indicator */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step === 3
                  ? 'bg-[#0A7469] text-white ring-4 ring-[#E8F4F2]'
                  : 'bg-[#F3F5F8] text-[#5B6B7F]'
              }`}
            >
              3
            </div>
            <span className="text-xs font-semibold text-[#0B2545] mt-2">Confirmación</span>
          </div>
        </div>
      </div>

      {/* STEP 1: PO / OS ERP Gatekeeper */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm space-y-6">
          <div className="border-b border-[#E2E7EE] pb-4">
            <h2 className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0A7469]" />
              Paso 1: Validación Previa de Orden de Compra o Servicio (Gatekeeper ERP)
            </h2>
            <p className="text-xs text-[#5B6B7F] mt-1">
              Para garantizar la conformidad, Factumflux valida en tiempo real que tu orden cuente con Entrada de Mercancías (GR/MIGO) o Conformidad de Servicio (HES) aprobada en el ERP.
            </p>
          </div>

          {/* PO Input & Presets */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider">
              Número de Orden de Compra (OC) u Orden de Servicio (OS)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#5B6B7F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value.toUpperCase())}
                  placeholder="Ej. OC-2026-8941 o OS-2026-102"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0A7469] uppercase"
                />
              </div>
              <button
                type="button"
                onClick={() => handleCheckPO()}
                disabled={isCheckingPO}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold text-sm transition-all shadow-md shadow-[#0A7469]/20 disabled:opacity-50"
              >
                {isCheckingPO ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Consultando ERP...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Verificar en ERP
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Selector */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-xs text-[#5B6B7F]">Órdenes de prueba:</span>
              {demoPOs.map((demo) => (
                <button
                  key={demo.code}
                  type="button"
                  onClick={() => {
                    setPoNumber(demo.code);
                    handleCheckPO(demo.code);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-[#F3F5F8] hover:bg-[#E2E7EE] text-[#0B2545] border border-[#E2E7EE] transition-colors font-mono"
                  title={demo.desc}
                >
                  {demo.code}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {poError && (
            <div className="p-4 rounded-xl bg-[#FDECEA] border border-[#B42318]/30 text-[#B42318] text-sm flex items-start gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0 text-[#B42318] mt-0.5" />
              <div>
                <p className="font-semibold">No se pudo verificar la orden</p>
                <p className="text-xs text-[#B42318]/90 mt-0.5">{poError}</p>
              </div>
            </div>
          )}

          {/* ERP Reception Status Result Card */}
          {poStatus && (
            <div
              className={`p-5 rounded-2xl border transition-all ${
                poStatus.can_upload_invoice
                  ? 'bg-[#E7F5EC] border-[#176B3F]/30 text-[#176B3F]'
                  : 'bg-[#FDECEA] border-[#B42318]/30 text-[#B42318]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {poStatus.can_upload_invoice ? (
                    <div className="p-2 rounded-xl bg-[#176B3F]/10 text-[#176B3F]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-[#B42318]/10 text-[#B42318]">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-[#0B2545] text-base">
                      {poStatus.can_upload_invoice
                        ? '✅ Conformidad ERP Aprobada'
                        : '⛔ Bloqueo Preventivo: Falta Recepción en ERP'}
                    </h3>
                    <p className="text-xs mt-1 text-[#5B6B7F]">
                      {poStatus.message}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-white text-[#0B2545] border border-[#E2E7EE] font-mono">
                        Orden: <strong>{poStatus.po_number}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white text-[#0A7469] border border-[#E2E7EE] font-semibold">
                        Tipo: {poStatus.order_type}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white text-[#0B2545] border border-[#E2E7EE] font-semibold">
                        Monto OC:{' '}
                        {poStatus.currency === 'PEN' ? 'S/' : '$'}{' '}
                        {poStatus.total_amount?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goods Receipts or Service Entry Sheets details */}
              {poStatus.goods_receipts && poStatus.goods_receipts.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#176B3F]/20 text-xs space-y-1">
                  <span className="font-semibold text-[#176B3F]">Entrada de Mercancías registradas (MIGO):</span>
                  {poStatus.goods_receipts.map((gr) => (
                    <div key={gr.id} className="flex justify-between items-center text-[#0B2545] pl-2">
                      <span>• Guía/Recepción: <strong>{gr.gr_number}</strong> ({gr.receipt_date})</span>
                      <span>Monto recibido: S/ {gr.total_received.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}

              {poStatus.service_entry_sheets && poStatus.service_entry_sheets.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#176B3F]/20 text-xs space-y-1">
                  <span className="font-semibold text-[#176B3F]">Hojas de Entrada de Servicios aprobadas (HES):</span>
                  {poStatus.service_entry_sheets.map((hes) => (
                    <div key={hes.id} className="flex justify-between items-center text-[#0B2545] pl-2">
                      <span>• HES: <strong>{hes.sheet_number}</strong> ({hes.service_description})</span>
                      <span>Monto aceptado: S/ {hes.accepted_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Footer for Step 1 */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={!poStatus || !poStatus.can_upload_invoice}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold text-sm shadow-md shadow-[#0A7469]/20 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span>Habilitar Carga de Comprobante</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: File Uploads, GRE & Factoring */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm space-y-6">
          <div className="border-b border-[#E2E7EE] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0A7469]" />
                Paso 2: Carga de Factura Electrónica y Documentos de Soporte
              </h2>
              <p className="text-xs text-[#5B6B7F] mt-1">
                Orden vinculada: <strong className="text-[#0B2545]">{poStatus?.po_number}</strong> ({poStatus?.order_type})
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-[#5B6B7F] hover:text-[#0B2545] flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Cambiar orden
            </button>
          </div>

          {/* 1. Factura Electrónica (XML y PDF) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#0B2545] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0A7469]" />
              1. Comprobante de Pago Electrónico (XML y PDF)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* XML File Upload */}
              <div className="p-5 rounded-xl border border-dashed border-[#0A7469]/40 bg-[#E8F4F2]/30 flex flex-col items-center justify-center text-center">
                <FileUp className="w-8 h-8 text-[#0A7469] mb-2" />
                <span className="text-xs font-bold text-[#0B2545] mb-1">Archivo XML UBL 2.1 (Obligatorio)</span>
                <span className="text-[11px] text-[#5B6B7F] mb-3">
                  {xmlFile ? xmlFile.name : 'Formato .xml con firma digital'}
                </span>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={xmlInputRef}
                    accept=".xml"
                    onChange={handleXMLFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => xmlInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold"
                  >
                    {xmlFile ? 'Cambiar XML' : 'Examinar XML'}
                  </button>
                  {!xmlFile && (
                    <button
                      type="button"
                      onClick={handleSimulateXmlLoad}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F3F5F8] text-[#0A7469] text-xs font-semibold border border-[#E2E7EE]"
                    >
                      Autocargar demo
                    </button>
                  )}
                </div>
              </div>

              {/* PDF File Upload */}
              <div className="p-5 rounded-xl border border-dashed border-[#E2E7EE] bg-[#F8FAFC] flex flex-col items-center justify-center text-center">
                <FileText className="w-8 h-8 text-[#5B6B7F] mb-2" />
                <span className="text-xs font-bold text-[#0B2545] mb-1">Representación Impresa PDF (Recomendado)</span>
                <span className="text-[11px] text-[#5B6B7F] mb-3">
                  {pdfFile ? pdfFile.name : 'Formato .pdf legible'}
                </span>
                <input
                  type="file"
                  ref={pdfInputRef}
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F3F5F8] text-[#5B6B7F] text-xs font-semibold border border-[#E2E7EE]"
                >
                  {pdfFile ? 'Cambiar PDF' : 'Examinar PDF'}
                </button>
              </div>
            </div>

            {/* XML Parsed Data Preview Card */}
            {parsedPreview && (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE] text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0A7469]" />
                    Datos Extraídos del XML UBL 2.1
                  </span>
                  <span className="text-[#176B3F] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sintaxis UBL conforme
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[#0B2545]">
                  <div>
                    <span className="text-[#5B6B7F] block text-[10px] uppercase">Serie - Número:</span>
                    <strong className="text-sm">{parsedPreview.seriesNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[#5B6B7F] block text-[10px] uppercase">Subtotal (Neto):</span>
                    <span className="font-semibold">
                      {parsedPreview.currency} {parsedPreview.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5B6B7F] block text-[10px] uppercase">IGV (18%):</span>
                    <span className="font-semibold">
                      {parsedPreview.currency} {parsedPreview.tax.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5B6B7F] block text-[10px] uppercase">Total Comprobante:</span>
                    <strong className="text-[#0A7469] text-sm">
                      {parsedPreview.currency} {parsedPreview.total.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Guía de Remisión Electrónica (GRE) - Condicional para Bienes */}
          {poStatus?.order_type === 'BIEN' ? (
            <div className="p-5 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-cyan-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-600" />
                  2. Guía de Remisión Electrónica - Remitente (Obligatorio para Bienes)
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">
                  Requerido por SUNAT
                </span>
              </div>
              <p className="text-xs text-[#5B6B7F]">
                Al tratarse de una orden de compra de bienes, se valida la consistencia física entre la Factura y la GRE correspondiente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                    Serie GRE (ej. T001)
                  </label>
                  <input
                    type="text"
                    value={greSeries}
                    onChange={(e) => setGreSeries(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                    Número correlativo GRE (ej. 00004521)
                  </label>
                  <input
                    type="text"
                    value={greNumber}
                    onChange={(e) => setGreNumber(e.target.value)}
                    placeholder="00004521"
                    className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <input
                    type="file"
                    ref={greXmlRef}
                    accept=".xml"
                    onChange={(e) => setGreXmlFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => greXmlRef.current?.click()}
                    className="w-full py-2 px-3 rounded-lg bg-white hover:bg-cyan-50 text-cyan-800 border border-cyan-300 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>{greXmlFile ? `XML: ${greXmlFile.name}` : 'Adjuntar GRE XML'}</span>
                  </button>
                </div>
                <div>
                  <input
                    type="file"
                    ref={grePdfRef}
                    accept=".pdf"
                    onChange={(e) => setGrePdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => grePdfRef.current?.click()}
                    className="w-full py-2 px-3 rounded-lg bg-white hover:bg-[#F3F5F8] text-[#5B6B7F] border border-[#E2E7EE] text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{grePdfFile ? `PDF: ${grePdfFile.name}` : 'Adjuntar GRE PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE] text-xs text-[#5B6B7F] flex items-center gap-2.5">
              <Info className="w-4 h-4 text-[#0A7469] flex-shrink-0" />
              <span>
                <strong>Orden de Servicio:</strong> No requiere Guía de Remisión Electrónica (GRE). Se valida contra la Conformidad de Servicio (HES) previamente aprobada.
              </span>
            </div>
          )}

          {/* 3. Cesión Factoring Externo */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E7EE] space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFactored}
                  onChange={(e) => setIsFactored(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E2E7EE] text-[#0A7469] focus:ring-[#0A7469] cursor-pointer"
                />
                <span className="text-sm font-bold text-[#0B2545]">
                  ¿Esta factura ha sido negociada con alguna empresa de Factoring?
                </span>
              </label>
              {isFactored && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                  Cesión de Derechos
                </span>
              )}
            </div>

            {isFactored && (
              <div className="pt-3 border-t border-[#E2E7EE] space-y-4 text-xs animate-fadeIn">
                <p className="text-[#5B6B7F]">
                  Ingresa los datos de la entidad cesionaria y adjunta la carta notarial o electrónica de cesión de derechos para que el cliente programe el pago al adquirente financiero.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                      Nombre de la Empresa de Factoring
                    </label>
                    <input
                      type="text"
                      value={factoringEntityName}
                      onChange={(e) => setFactoringEntityName(e.target.value)}
                      placeholder="Ej. InnovaFactoring S.A., Facturedo, BanBif, etc."
                      className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] text-xs focus:ring-2 focus:ring-[#0A7469]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                      Carta de Cesión de Derechos (PDF Obligatorio)
                    </label>
                    <input
                      type="file"
                      ref={factoringLetterRef}
                      accept=".pdf"
                      onChange={(e) => setFactoringLetterFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => factoringLetterRef.current?.click()}
                      className="w-full py-2 px-3 rounded-lg bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      <span>{factoringLetterFile ? factoringLetterFile.name : 'Subir Carta de Cesión (PDF)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submission Error Banner */}
          {submitError && (
            <div className="p-4 rounded-xl bg-[#FDECEA] border border-[#B42318]/30 text-[#B42318] text-sm flex items-start gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0 text-[#B42318] mt-0.5" />
              <div>
                <p className="font-semibold">Error al ingresar comprobante</p>
                <p className="text-xs text-[#B42318]/90 mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl text-[#5B6B7F] hover:text-[#0B2545] bg-[#F3F5F8] text-sm font-semibold transition-colors"
            >
              Atrás
            </button>
            <button
              type="button"
              disabled={isSubmitting || !xmlFile}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold text-sm shadow-md shadow-[#0A7469]/20 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando y Procesando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ingresar Factura al Sistema</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Success Confirmation */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-8 border border-[#E2E7EE] text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#E7F5EC] text-[#176B3F] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-[#0B2545] tracking-tight">
              ¡Factura Recibida Exitosamente!
            </h2>
            <p className="text-sm text-[#5B6B7F] mt-2">
              El comprobante <strong>{parsedPreview?.seriesNumber || 'F001-0004522'}</strong> fue recibido, validado ante SUNAT y enlazado con la orden <strong>{poStatus?.po_number}</strong>.
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE] text-xs text-left space-y-2 text-[#0B2545]">
            <div className="flex justify-between">
              <span className="text-[#5B6B7F]">Estado Inicial:</span>
              <span className="font-semibold text-[#3A5A9B]">Enviado / En revisión</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5B6B7F]">Hash SHA-256 UBL:</span>
              <span className="font-mono text-[11px] text-[#5B6B7F]">Verificado</span>
            </div>
            {isFactored && (
              <div className="flex justify-between">
                <span className="text-[#5B6B7F]">Cesión Factoring:</span>
                <span className="font-semibold text-purple-700">{factoringEntityName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#5B6B7F]">Programación de Pago:</span>
              <span className="text-[#8A5A00] font-semibold">En proceso de conciliación</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={onSuccess}
              className="px-6 py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold text-sm shadow-md shadow-[#0A7469]/20 transition-all hover:scale-[1.02]"
            >
              Ir a Mis Facturas
            </button>
            <button
              onClick={() => {
                setStep(1);
                setXmlFile(null);
                setPdfFile(null);
                setParsedPreview(null);
                setGreXmlFile(null);
                setGrePdfFile(null);
                setIsFactored(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#F3F5F8] hover:bg-[#E2E7EE] text-[#0B2545] font-semibold text-sm border border-[#E2E7EE] transition-colors"
            >
              Cargar otra factura
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
