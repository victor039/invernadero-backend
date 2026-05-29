ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tipo_cliente VARCHAR(255) DEFAULT 'registrado';
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS cliente_paso VARCHAR(255);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(255);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS referencia_pago VARCHAR(255);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS ticket_descarga BOOLEAN DEFAULT TRUE;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS ticket_correo BOOLEAN DEFAULT FALSE;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS correo_ticket VARCHAR(255);

UPDATE ventas SET tipo_cliente = 'registrado' WHERE tipo_cliente IS NULL;
UPDATE ventas SET ticket_descarga = TRUE WHERE ticket_descarga IS NULL;
UPDATE ventas SET ticket_correo = FALSE WHERE ticket_correo IS NULL;
