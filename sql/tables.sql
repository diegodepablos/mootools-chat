/* You have to link 'remitente' and 'destinatario' to your users pk table */

CREATE TABLE `chat` (
 `idmensaje` int(11) NOT NULL AUTO_INCREMENT,
 `remitente` int(11) NOT NULL,
 `destinatario` int(11) NOT NULL,
 `texto` mediumtext,
 `fecha` datetime NOT NULL,
 `leido` tinyint(1) DEFAULT '0',
 `borrado` tinyint(1) DEFAULT '0',
 PRIMARY KEY (`idmensaje`),
 KEY `remitente` (`remitente`),
 KEY `destinatario` (`destinatario`),
 CONSTRAINT `chat_ibfk_1` FOREIGN KEY (`remitente`) REFERENCES `usuario` (`idusuario`),
 CONSTRAINT `chat_ibfk_2` FOREIGN KEY (`destinatario`) REFERENCES `usuario` (`idusuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8

CREATE TABLE `chat_estado` (
 `idestado` int(11) NOT NULL AUTO_INCREMENT,
 `remitente` int(11) NOT NULL,
 `destinatario` int(11) NOT NULL,
 `abierto` tinyint(1) DEFAULT '1',
 `maximizado` tinyint(1) DEFAULT '1',
 `posicion` tinyint(2) DEFAULT '0',
 PRIMARY KEY (`idestado`),
 KEY `remitente` (`remitente`),
 KEY `destinatario` (`destinatario`),
 CONSTRAINT `chat_estado_ibfk_1` FOREIGN KEY (`remitente`) REFERENCES `usuario` (`idusuario`),
 CONSTRAINT `chat_estado_ibfk_2` FOREIGN KEY (`destinatario`) REFERENCES `usuario` (`idusuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
