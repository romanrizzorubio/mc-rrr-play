export const createAccountActivationEmail = ({to, displayName, activationLink}) => ({
    to,
    subject: 'Activa tu cuenta de MC RRR Play',
    text: `Hola ${displayName}:\n\nActiva tu cuenta y elige una contraseña en este enlace:\n${activationLink}\n\nEl enlace caduca en 24 horas.`,
});

export const createPasswordResetEmail = ({to, displayName, resetLink}) => ({
    to,
    subject: 'Restablece tu contraseña de MC RRR Play',
    text: `Hola ${displayName}:\n\nElige una nueva contraseña en este enlace:\n${resetLink}\n\nEl enlace caduca en una hora. Si no solicitaste el cambio, ignora este correo.`,
});
