
DROP TABLE IF EXISTS `utilisateurs`;
CREATE TABLE `utilisateurs` (
  `mail` varchar(100) NOT NULL DEFAULT '',
  `pseudo` varchar(50) DEFAULT NULL,
  `mdp` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`mail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `utilisateurs` WRITE;


INSERT INTO `utilisateurs` (`mail`, `pseudo`, `mdp`)
VALUES
	('alleseck66@gmail.com','Ali','Seck'),
    ('alleseck23@gmail.com', 'Alex','Seck');

UNLOCK TABLES;
