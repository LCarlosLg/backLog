-- ===========================================
-- Crear y seleccionar la base de datos
-- ===========================================
CREATE DATABASE IF NOT EXISTS backlog_db;
USE backlog_db;

-- ===========================================
-- Tabla: usuarios
-- ===========================================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    rol ENUM('estudiante', 'instructor') NOT NULL,
    foto VARCHAR(255) DEFAULT 'default.png',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- Tabla: clases
-- ===========================================
CREATE TABLE clases (
    id_clase INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    horario DATETIME NOT NULL,
    cupo_maximo INT NOT NULL,
    id_instructor INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_instructor) REFERENCES usuarios(id_usuario)
);

-- ===========================================
-- Tabla: reservas
-- ===========================================
CREATE TABLE reservas (
    id_reserva INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_clase INT NOT NULL,
    fecha_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('confirmada', 'cancelada') DEFAULT 'confirmada',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_clase) REFERENCES clases(id_clase)
);

-- ===========================================
-- Tabla: reseñas
-- ===========================================
CREATE TABLE reseñas (
    id_reseña INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_clase INT NOT NULL,
    calificacion INT CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_clase) REFERENCES clases(id_clase)
);

-- ===========================================
-- Trigger: Validar que solo instructores puedan crear clases
-- ===========================================
DELIMITER //
CREATE TRIGGER validar_instructor_clase
BEFORE INSERT ON clases
FOR EACH ROW
BEGIN
    DECLARE rol_usuario ENUM('estudiante', 'instructor');
    SELECT rol INTO rol_usuario FROM usuarios WHERE id_usuario = NEW.id_instructor;
    
    IF rol_usuario <> 'instructor' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Solo los usuarios con rol instructor pueden crear clases';
    END IF;
END;
//
DELIMITER ;

-- ===========================================
-- Datos iniciales
-- ===========================================
INSERT INTO usuarios (nombre, email, contraseña, rol, foto)
VALUES 
('Carlos López', 'carlos@example.com', '$2a$10$hashEjemplo1', 'instructor', 'default.png'),
('Ana Martínez', 'ana@example.com', '$2a$10$hashEjemplo2', 'estudiante', 'default.png');

INSERT INTO clases (titulo, descripcion, precio, horario, cupo_maximo, id_instructor)
VALUES
('Yoga para principiantes', 'Clase básica de yoga enfocada en respiración y estiramiento.', 200.00, '2025-11-15 10:00:00', 15, 1),
('Entrenamiento funcional', 'Rutina de ejercicios de cuerpo completo para mejorar fuerza y resistencia.', 300.00, '2025-11-16 09:00:00', 10, 1);

INSERT INTO reservas (id_usuario, id_clase)
VALUES (2, 1);

INSERT INTO reseñas (id_usuario, id_clase, calificacion, comentario)
VALUES (2, 1, 5, 'Excelente clase, muy recomendable!');

-- ===========================================
-- Tabla: notificaciones
-- ===========================================
CREATE TABLE notificaciones (
  id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
  id_instructor INT NOT NULL,
  id_alumno INT NOT NULL,
  id_clase INT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_instructor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_alumno) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_clase) REFERENCES clases(id_clase) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notificaciones_instructor ON notificaciones(id_instructor);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);

-- ===========================================
-- TRIGGER: Crear notificación cuando se hace una reserva
-- ===========================================
DELIMITER //
CREATE TRIGGER crear_notificacion_reserva
AFTER INSERT ON reservas
FOR EACH ROW
BEGIN
  DECLARE nombre_alumno VARCHAR(150);
  DECLARE titulo_clase VARCHAR(255);
  DECLARE horario_clase DATETIME;
  DECLARE id_inst INT;
  DECLARE mensaje_notif TEXT;
  
  SELECT u.nombre INTO nombre_alumno FROM usuarios u WHERE u.id_usuario = NEW.id_usuario;
  SELECT c.titulo, c.horario, c.id_instructor 
    INTO titulo_clase, horario_clase, id_inst 
    FROM clases c WHERE c.id_clase = NEW.id_clase;
  
  SET mensaje_notif = CONCAT('Nuevo alumno inscrito: ', nombre_alumno, ' en la clase "', titulo_clase, '" a las ', DATE_FORMAT(horario_clase, '%H:%i'));
  
  INSERT INTO notificaciones (id_instructor, id_alumno, id_clase, mensaje)
  VALUES (id_inst, NEW.id_usuario, NEW.id_clase, mensaje_notif);
END//
DELIMITER ;

