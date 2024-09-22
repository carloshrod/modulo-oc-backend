export const approvePoOptions = (mailTo, poNumber) => {
  return {
    from: `"Admin" ${process.env.EMAIL}`,
    to: mailTo?.email,
    subject: "Notificación de Aprobación de Orden de Compra",
    html: `Hola ${mailTo?.full_name},<br><br>
      Tienes una orden de compra para aprobar. Por favor, revisa la <strong>${poNumber}</strong>.<br><br>
      Gracias,<br>El equipo de administración.`,
  };
};

export const rejectPoOptions = (mailTo, poNumber, comments) => {
  return {
    from: `"Admin" ${process.env.EMAIL}`,
    to: mailTo?.email,
    subject: "Notificación de Rechazo de Orden de Compra",
    html: `Hola ${mailTo?.full_name},<br><br>
      La orden de compra <strong>${poNumber}</strong> fue rechazada.<br><br>
      <strong>Comentarios: "<em>${comments}</em>"</strong><br><br>
      Gracias,<br>El equipo de administración.`,
  };
};
