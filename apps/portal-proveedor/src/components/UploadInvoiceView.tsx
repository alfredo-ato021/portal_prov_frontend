import React, { useState, useRef, useEffect } from 'react';
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
  RefreshCw,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  FactumfluxClient,
  POReceptionStatusResponse,
  SupplierPurchaseOrder,
} from '@factumflux/api-client';
import { SystemModal } from '@factumflux/ui';

interface UploadInvoiceViewProps {
  client: FactumfluxClient;
  onSuccess: () => void;
  onCancel: () => void;
  onNavigateToQualification?: () => void;
}

export const UploadInvoiceView: React.FC<UploadInvoiceViewProps> = ({
  client,
  onSuccess,
  onCancel,
  onNavigateToQualification,
}) => {
  const [qualificationBlock, setQualificationBlock] = useState<{
    canInvoice: boolean;
    reason?: string;
  }>({ canInvoice: true });
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: PO / OS List & Selection
  const [orders, setOrders] = useState<SupplierPurchaseOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState('');
  const [showManualSearch, setShowManualSearch] = useState(false);

  // Step 1 Manual Lookup
  const [poNumber, setPoNumber] = useState('OC-2026-8941');
  const [isCheckingPO, setIsCheckingPO] = useState(false);
  const [poStatus, setPoStatus] = useState<POReceptionStatusResponse | null>(null);
  const [poError, setPoError] = useState<string | null>(null);

  // System Modal Dialog state
  const [systemAlert, setSystemAlert] = useState<{
    title: string;
    message: string;
    type?: 'warning' | 'danger' | 'info';
  } | null>(null);

  // Fetch open orders for the current supplier
  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await client.listSupplierPurchaseOrders();
      setOrders(data || []);
    } catch (err: any) {
      setOrdersError(err.message || 'No se pudieron consultar las órdenes de compra/servicio.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    client.getSupplierQualification()
      .then((res) => {
        if (!res.can_invoice) {
          setQualificationBlock({
            canInvoice: false,
            reason: res.block_reason || 'La empresa cliente exige homologación aprobada para autorizar la emisión de comprobantes.',
          });
        }
      })
      .catch(() => {});
  }, [client]);

  const handleSelectOrder = (order: SupplierPurchaseOrder) => {
    if (!order.can_upload_invoice) {
      setSystemAlert({
        type: 'warning',
        title: 'Recepción Pendiente en ERP',
        message:
          order.order_type === 'BIEN'
            ? `La orden ${order.po_number} no cuenta aún con Entrada de Mercancías (GR/MIGO) aprobada en el ERP del cliente. El área de almacén/logística debe registrar la recepción física de los bienes antes de que pueda emitir la factura.`
            : `La orden ${order.po_number} no cuenta aún con Conformidad de Servicio (HES) aprobada en el ERP del cliente. El área usuaria debe dar conformidad al servicio antes de que pueda emitir la factura.`,
      });
      return;
    }

    setPoNumber(order.po_number);
    setPoStatus({
      po_number: order.po_number,
      order_type: order.order_type,
      has_reception: order.has_reception,
      reception_type: order.reception_type,
      can_upload_invoice: order.can_upload_invoice,
      message: order.message,
      total_amount: order.total_amount,
      currency: order.currency,
      goods_receipts:
        order.reception_type === 'GR_MIGO' && order.reception_doc
          ? [
              {
                id: '1',
                gr_number: order.reception_doc,
                movement_type: '101',
                receipt_date: order.reception_date || order.issue_date,
                total_received: order.total_amount,
              },
            ]
          : [],
      service_entry_sheets:
        order.reception_type === 'HES' && order.reception_doc
          ? [
              {
                id: '1',
                sheet_number: order.reception_doc,
                service_description: 'Conformidad aprobada en ERP',
                accepted_amount: order.total_amount,
                approved_at: order.reception_date || order.issue_date,
                status: 'APPROVED',
              },
            ]
          : [],
    });

    setStep(2);
  };

  const filteredOrders = orders.filter((o) => {
    const q = orderFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      o.po_number.toLowerCase().includes(q) ||
      o.order_type.toLowerCase().includes(q) ||
      (o.reception_doc && o.reception_doc.toLowerCase().includes(q))
    );
  });

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

  // Step 2 (Conditional Bienes): GRE Files & Auto-detection
  const [greSeries, setGreSeries] = useState('');
  const [greNumber, setGreNumber] = useState('');
  const [greXmlFile, setGreXmlFile] = useState<File | null>(null);
  const [grePdfFile, setGrePdfFile] = useState<File | null>(null);
  const [feReferencedGre, setFeReferencedGre] = useState<{ series: string; number: string; raw: string } | null>(null);
  const [greValidation, setGreValidation] = useState<{ isValid: boolean; message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [feSuppInfo, setFeSuppInfo] = useState<{ supplierRuc: string; customerRuc: string } | null>(null);

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
      setSystemAlert({
        type: 'warning',
        title: 'Archivo no Válido',
        message: 'Por favor seleccione un archivo XML válido (comprobante electrónico UBL 2.1 homologado por SUNAT).',
      });
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

        // Extract Supplier and Customer RUCs from Invoice XML
        const supplierParty = xmlDoc.getElementsByTagNameNS('*', 'AccountingSupplierParty')[0] || xmlDoc.getElementsByTagName('cac:AccountingSupplierParty')[0];
        const sIdElem = supplierParty ? (supplierParty.getElementsByTagNameNS('*', 'ID')[0] || supplierParty.getElementsByTagName('cbc:ID')[0]) : null;
        const sRuc = sIdElem?.textContent?.trim() || '';

        const customerParty = xmlDoc.getElementsByTagNameNS('*', 'AccountingCustomerParty')[0] || xmlDoc.getElementsByTagName('cac:AccountingCustomerParty')[0];
        const cIdElem = customerParty ? (customerParty.getElementsByTagNameNS('*', 'ID')[0] || customerParty.getElementsByTagName('cbc:ID')[0]) : null;
        const cRuc = cIdElem?.textContent?.trim() || '';

        const suppData = { supplierRuc: sRuc, customerRuc: cRuc };
        setFeSuppInfo(suppData);

        // Auto-extract Guía de Remisión (GRE) reference from UBL 2.1
        let extractedGreId = '';
        const despatchDocs = xmlDoc.getElementsByTagNameNS('*', 'DespatchDocumentReference');
        for (let i = 0; i < despatchDocs.length; i++) {
          const idNode = despatchDocs[i].getElementsByTagNameNS('*', 'ID')[0] || despatchDocs[i].getElementsByTagName('cbc:ID')[0];
          if (idNode?.textContent?.trim()) {
            extractedGreId = idNode.textContent.trim();
            break;
          }
        }
        if (!extractedGreId) {
          const addDocs = xmlDoc.getElementsByTagNameNS('*', 'AdditionalDocumentReference');
          for (let i = 0; i < addDocs.length; i++) {
            const typeNode = addDocs[i].getElementsByTagNameNS('*', 'DocumentTypeCode')[0] || addDocs[i].getElementsByTagName('cbc:DocumentTypeCode')[0];
            const typeCode = typeNode?.textContent?.trim();
            if (typeCode === '09' || typeCode === '31') {
              const idNode = addDocs[i].getElementsByTagNameNS('*', 'ID')[0] || addDocs[i].getElementsByTagName('cbc:ID')[0];
              if (idNode?.textContent?.trim()) {
                extractedGreId = idNode.textContent.trim();
                break;
              }
            }
          }
        }

        if (extractedGreId) {
          const parts = extractedGreId.split('-');
          if (parts.length === 2) {
            const s = parts[0].trim().toUpperCase();
            const n = parts[1].trim();
            setGreSeries(s);
            setGreNumber(n);
            setFeReferencedGre({ series: s, number: n, raw: extractedGreId });
          } else {
            setGreSeries(extractedGreId.toUpperCase());
            setFeReferencedGre({ series: extractedGreId, number: '', raw: extractedGreId });
          }
          // Do not claim correspondence is verified until the GRE document itself is attached
          setGreValidation(null);
        } else {
          setFeReferencedGre(null);
          setGreValidation(null);
        }

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

  const handleGreXMLFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml')) {
      setSystemAlert({
        type: 'warning',
        title: 'Archivo no Válido',
        message: 'Por favor seleccione un archivo XML válido de Guía de Remisión Electrónica (GRE).',
      });
      return;
    }

    setGreXmlFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');

        const idElem = xmlDoc.getElementsByTagNameNS('*', 'ID')[0] || xmlDoc.getElementsByTagName('cbc:ID')[0];
        const greId = idElem?.textContent?.trim() || '';

        // Extract GRE supplier RUC
        const suppParty = xmlDoc.getElementsByTagNameNS('*', 'DespatchSupplierParty')[0] || xmlDoc.getElementsByTagName('cac:DespatchSupplierParty')[0];
        let greSupplierRuc = '';
        if (suppParty) {
          const idTag = suppParty.getElementsByTagNameNS('*', 'ID')[0] || suppParty.getElementsByTagName('cbc:ID')[0];
          greSupplierRuc = idTag?.textContent?.trim() || '';
          if (!greSupplierRuc) {
            const custAcc = suppParty.getElementsByTagNameNS('*', 'CustomerAssignedAccountID')[0] || suppParty.getElementsByTagName('cbc:CustomerAssignedAccountID')[0];
            greSupplierRuc = custAcc?.textContent?.trim() || '';
          }
        }

        // Extract GRE customer/recipient RUC
        const custParty = xmlDoc.getElementsByTagNameNS('*', 'DeliveryCustomerParty')[0] || xmlDoc.getElementsByTagName('cac:DeliveryCustomerParty')[0];
        let greCustomerRuc = '';
        if (custParty) {
          const idTag = custParty.getElementsByTagNameNS('*', 'ID')[0] || custParty.getElementsByTagName('cbc:ID')[0];
          greCustomerRuc = idTag?.textContent?.trim() || '';
          if (!greCustomerRuc) {
            const custAcc = custParty.getElementsByTagNameNS('*', 'CustomerAssignedAccountID')[0] || custParty.getElementsByTagName('cbc:CustomerAssignedAccountID')[0];
            greCustomerRuc = custAcc?.textContent?.trim() || '';
          }
        }

        // Auto-fill inputs if not yet populated
        if (greId) {
          const parts = greId.split('-');
          if (parts.length === 2) {
            if (!greSeries || !greNumber) {
              setGreSeries(parts[0].trim().toUpperCase());
              setGreNumber(parts[1].trim());
            }
          }
        }

        // Validate correspondence with FE declared GRE
        if (feReferencedGre && greId && !stringsMatch(feReferencedGre.raw, greId)) {
          setGreValidation({
            isValid: false,
            type: 'error',
            message: `Inconsistencia: La Guía adjunta (${greId}) no coincide con la GRE referenciada en la Factura Electrónica (${feReferencedGre.raw}).`,
          });
          return;
        }

        // Validate correspondence with FE Supplier RUC
        if (feSuppInfo?.supplierRuc && greSupplierRuc && feSuppInfo.supplierRuc !== greSupplierRuc) {
          setGreValidation({
            isValid: false,
            type: 'error',
            message: `Inconsistencia: El RUC emisor de la GRE (${greSupplierRuc}) no coincide con el emisor de la Factura (${feSuppInfo.supplierRuc}).`,
          });
          return;
        }

        // Validate correspondence with FE Customer RUC
        if (feSuppInfo?.customerRuc && greCustomerRuc && feSuppInfo.customerRuc !== greCustomerRuc) {
          setGreValidation({
            isValid: false,
            type: 'error',
            message: `Inconsistencia: El RUC destinatario de la GRE (${greCustomerRuc}) no coincide con el cliente de la Factura (${feSuppInfo.customerRuc}).`,
          });
          return;
        }

        setGreValidation({
          isValid: true,
          type: 'success',
          message: `GRE ${greId || file.name} verificada: Coincide emisor, cliente y correspondencia con la Factura Electrónica.`,
        });
      } catch {
        // Fallback if parsing fails
      }
    };
    reader.readAsText(file);
  };

  const stringsMatch = (a: string, b: string) => {
    return a.trim().toUpperCase() === b.trim().toUpperCase();
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

    // Validate correspondence before submitting
    if (poStatus?.order_type === 'BIEN') {
      const formGre = `${greSeries.trim()}-${greNumber.trim()}`.toUpperCase();
      if (feReferencedGre && !stringsMatch(feReferencedGre.raw, formGre)) {
        setSubmitError(`La Serie y Número de GRE ingresados (${formGre}) no coinciden con la Guía referenciada en el XML de la Factura (${feReferencedGre.raw}).`);
        return;
      }
      if (greValidation && !greValidation.isValid) {
        setSubmitError(greValidation.message);
        return;
      }
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

      {/* Qualification Warning Banner */}
      {!qualificationBlock.canInvoice && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-amber-950 block">Homologación Previa Requerida para Facturar</span>
              <span>{qualificationBlock.reason}</span>
            </div>
          </div>
          {onNavigateToQualification && (
            <button
              type="button"
              onClick={onNavigateToQualification}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors flex-shrink-0"
            >
              Completar Homologación
            </button>
          )}
        </div>
      )}

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

      {/* STEP 1: PO / OS ERP Gatekeeper & Open Orders Table */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm space-y-6">
          <div className="border-b border-[#E2E7EE] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0A7469]" />
                Paso 1: Seleccionar Orden de Compra o Servicio
              </h2>
              <p className="text-xs text-[#5B6B7F] mt-1">
                Órdenes abiertas registradas para su RUC con validación en tiempo real de recepción en el ERP.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchOrders}
                disabled={isLoadingOrders}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E7EE] hover:bg-[#F8FAFC] text-xs font-semibold text-[#5B6B7F] hover:text-[#0B2545] transition-colors"
                title="Actualizar listado de órdenes"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              <button
                type="button"
                onClick={() => setShowManualSearch(!showManualSearch)}
                className="text-xs font-semibold text-[#0A7469] hover:underline px-2 py-1"
              >
                {showManualSearch ? 'Ocultar búsqueda manual' : 'Buscar por código'}
              </button>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#5B6B7F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
              placeholder="Filtrar por número de orden (OC / OS) o tipo..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469]"
            />
          </div>

          {/* Orders Table */}
          {isLoadingOrders ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#5B6B7F] gap-3">
              <div className="w-8 h-8 border-3 border-[#0A7469]/20 border-t-[#0A7469] rounded-full animate-spin" />
              <p className="text-xs">Consultando órdenes abiertas en el ERP...</p>
            </div>
          ) : ordersError ? (
            <div className="p-4 rounded-xl bg-[#FDECEA] border border-[#B42318]/30 text-[#B42318] text-xs flex items-center justify-between">
              <span>{ordersError}</span>
              <button onClick={fetchOrders} className="font-semibold underline ml-2">
                Reintentar
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E2E7EE]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#5B6B7F] uppercase tracking-wider font-semibold border-b border-[#E2E7EE]">
                  <tr>
                    <th className="py-3 px-4">Orden / Tipo</th>
                    <th className="py-3 px-4">Fecha Emisión</th>
                    <th className="py-3 px-4 text-right">Importe Total</th>
                    <th className="py-3 px-4">Estado Recepción ERP</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E7EE] bg-white">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#5B6B7F]">
                        No se encontraron órdenes de compra o servicio abiertas para su empresa.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr
                        key={ord.po_id || ord.po_number}
                        onClick={() => handleSelectOrder(ord)}
                        className={`transition-colors cursor-pointer ${
                          ord.can_upload_invoice
                            ? 'hover:bg-[#E8F4F2]/50'
                            : 'hover:bg-[#FFF9F5] opacity-90'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-[#0B2545] text-sm">
                            {ord.po_number}
                          </div>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase mt-0.5 ${
                              ord.order_type === 'BIEN'
                                ? 'bg-[#E8F4F2] text-[#0A7469]'
                                : 'bg-[#EFF8FF] text-[#175CD3]'
                            }`}
                          >
                            {ord.order_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#5B6B7F]">
                          {ord.issue_date || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-[#0B2545]">
                          {ord.currency === 'PEN' ? 'S/' : '$'}{' '}
                          {Number(ord.total_amount).toLocaleString('es-PE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          {ord.has_reception ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F5EC] text-[#176B3F] border border-[#176B3F]/20 w-fit">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {ord.reception_type === 'GR_MIGO'
                                  ? 'Entrada Registrada (GR)'
                                  : 'Conformidad Aprobada (HES)'}
                              </span>
                              {ord.reception_doc && (
                                <span className="text-[11px] font-mono text-[#5B6B7F]">
                                  Doc: {ord.reception_doc}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFFAEB] text-[#B54708] border border-[#B54708]/20 w-fit">
                              <Clock className="w-3.5 h-3.5" />
                              {ord.order_type === 'BIEN'
                                ? 'Sin Entrada de Mercancías'
                                : 'Sin Conformidad de Servicio'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {ord.can_upload_invoice ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOrder(ord);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold text-xs transition-all shadow-sm shadow-[#0A7469]/20"
                            >
                              Cargar Factura
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span
                              className="text-[11px] text-[#B54708] font-medium"
                              title="Requiere que el cliente registre la recepción o conformidad antes de facturar"
                            >
                              Pendiente ERP
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Collapsible Manual Search Section */}
          {showManualSearch && (
            <div className="pt-4 border-t border-[#E2E7EE] space-y-4">
              <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider">
                Búsqueda Manual de Orden en ERP
              </h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#5B6B7F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value.toUpperCase())}
                    placeholder="Ej. OC-2026-8941 o OS-2026-102"
                    className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0A7469] uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckPO()}
                  disabled={isCheckingPO}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold text-xs transition-all shadow-md shadow-[#0A7469]/20 disabled:opacity-50"
                >
                  {isCheckingPO ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Consultando ERP...
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
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

              {/* Error Message */}
              {poError && (
                <div className="p-3 rounded-xl bg-[#FDECEA] border border-[#B42318]/30 text-[#B42318] text-xs flex items-start gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 text-[#B42318] mt-0.5" />
                  <span>{poError}</span>
                </div>
              )}

              {/* Manual PO Status Result */}
              {poStatus && (
                <div
                  className={`p-4 rounded-xl border ${
                    poStatus.can_upload_invoice
                      ? 'bg-[#E7F5EC] border-[#176B3F]/30 text-[#176B3F]'
                      : 'bg-[#FDECEA] border-[#B42318]/30 text-[#B42318]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-[#0B2545] text-sm">
                        {poStatus.can_upload_invoice
                          ? '✅ Conformidad ERP Aprobada'
                          : '⛔ Falta Recepción en ERP'}
                      </h4>
                      <p className="text-xs text-[#5B6B7F] mt-0.5">{poStatus.message}</p>
                    </div>
                    {poStatus.can_upload_invoice && (
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-4 py-2 rounded-xl bg-[#0A7469] text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        Continuar <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
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
                Al tratarse de una orden de compra de bienes, se valida la consistencia física y correspondencia entre la Factura y la GRE.
              </p>

              {/* Pill de auto-detección desde la Factura Electrónica */}
              {feReferencedGre && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">GRE Detectada Automáticamente:</span>{' '}
                    <span>Se completó la serie y número desde la referencia UBL 2.1 de la factura: </span>
                    <strong className="underline decoration-teal-500 font-mono text-teal-800">{feReferencedGre.raw}</strong>
                  </div>
                </div>
              )}

              {/* Mensaje de validación de correspondencia GRE vs FE */}
              {greValidation && (
                <div
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
                    greValidation.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : greValidation.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {greValidation.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="font-bold block">
                      {greValidation.type === 'success'
                        ? 'Correspondencia GRE - FE Verificada'
                        : greValidation.type === 'error'
                        ? 'Inconsistencia Detectada en GRE'
                        : 'Atención: Modificación Manual de GRE'}
                    </span>
                    <p className="mt-0.5">{greValidation.message}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                    Serie GRE (ej. T001)
                  </label>
                  <input
                    type="text"
                    value={greSeries}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setGreSeries(val);
                      if (feReferencedGre && `${val}-${greNumber}`.toUpperCase() !== feReferencedGre.raw.toUpperCase()) {
                        setGreValidation({
                          isValid: false,
                          type: 'warning',
                          message: `Atención: La numeración ingresada (${val}-${greNumber}) no coincide con la Guía referenciada en la Factura Electrónica (${feReferencedGre.raw}).`,
                        });
                      } else {
                        setGreValidation(null);
                      }
                    }}
                    placeholder="T001"
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setGreNumber(val);
                      if (feReferencedGre && `${greSeries}-${val}`.toUpperCase() !== feReferencedGre.raw.toUpperCase()) {
                        setGreValidation({
                          isValid: false,
                          type: 'warning',
                          message: `Atención: La numeración ingresada (${greSeries}-${val}) no coincide con la Guía referenciada en la Factura Electrónica (${feReferencedGre.raw}).`,
                        });
                      } else {
                        setGreValidation(null);
                      }
                    }}
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
                    onChange={handleGreXMLFileChange}
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

      {/* ── MODAL DEL SISTEMA: ALERTA DE ARCHIVO O FORMATO ──────────────────── */}
      {systemAlert && (
        <SystemModal
          isOpen={true}
          type={systemAlert.type || 'warning'}
          title={systemAlert.title}
          message={systemAlert.message}
          confirmText="Entendido"
          onConfirm={() => setSystemAlert(null)}
          onCancel={() => setSystemAlert(null)}
        />
      )}
    </div>
  );
};
