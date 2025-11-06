// Centralized toast notification service with consistent styling
import { toast } from "sonner";

const TOAST_STYLES = {
  success: {
    background: '#16a34a',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  error: {
    background: '#dc2626',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  info: {
    background: '#3b82f6',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  warning: {
    background: '#f59e0b',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
  }
};

export class ToastService {
  /**
   * Show success notification
   */
  static success(message: string, width: string = '400px', duration: number = 2000) {
    toast.success(message, {
      style: { ...TOAST_STYLES.success, width },
      duration
    });
  }

  /**
   * Show error notification
   */
  static error(message: string, width: string = '450px', duration: number = 4000) {
    toast.error(message, {
      style: { ...TOAST_STYLES.error, width },
      duration
    });
  }

  /**
   * Show info notification
   */
  static info(message: string, width: string = '400px', duration: number = 3000) {
    toast.info(message, {
      style: { ...TOAST_STYLES.info, width },
      duration
    });
  }

  /**
   * Show warning notification
   */
  static warning(message: string, width: string = '400px', duration: number = 3000) {
    toast(message, {
      style: { ...TOAST_STYLES.warning, width },
      duration
    });
  }

  /**
   * Show mesa already finalized error
   */
  static mesaAlreadyFinalized(mesaNumber: number, categoryLabel: string) {
    this.error(
      `Mesa N° ${mesaNumber.toString().padStart(6, '0')} ya ha sido recontada para ${categoryLabel}`,
      '550px',
      5000
    );
  }

  /**
   * Show mesa not found error
   */
  static mesaNotFound(mesaNumber: number) {
    this.error(
      `Mesa N° ${mesaNumber.toString().padStart(6, '0')} no encontrada en los datos electorales`,
      '450px',
      4000
    );
  }

  /**
   * Show auto-completed data notification
   */
  static autoCompleted(cedulasExcedentes: number | null, tcv: number | null) {
    const messages = [];
    if (cedulasExcedentes !== null) messages.push(`Cédulas Excedentes: ${cedulasExcedentes}`);
    if (tcv !== null) messages.push(`TCV: ${tcv}`);

    if (messages.length > 0) {
      this.info(`Auto-completado - ${messages.join(', ')}`, '500px', 3000);
    }
  }

  /**
   * Show acta already empty info
   */
  static actaAlreadyEmpty() {
    this.info("La acta actual ya está vacía", '400px', 2000);
  }

  /**
   * Show new acta created success
   */
  static newActaCreated() {
    this.success("Nuevo recuento", '400px', 2000);
  }

  /**
   * Show acta switched success
   */
  static actaSwitched(actaNumber: string) {
    this.info(`Acta cambiada: ${actaNumber || 'Sin número'}`, '400px', 2000);
  }
}
