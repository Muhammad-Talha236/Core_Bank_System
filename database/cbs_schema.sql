-- =====================================================
-- Core Banking System (CBS) - Updated Database Schema
-- 8-digit Account Numbers + One Account Per Customer
-- =====================================================

CREATE DATABASE IF NOT EXISTS cbs;
USE cbs;

-- =====================================================
-- Table 1: Customer
-- =====================================================
CREATE TABLE IF NOT EXISTS Customer (
    CustomerID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    CNIC VARCHAR(20) UNIQUE NOT NULL,
    Contact VARCHAR(20) NOT NULL,
    Gmail VARCHAR(100) UNIQUE NOT NULL
);

-- =====================================================
-- Table 2: Account (UPDATED - 8 digit account numbers -> INT UNSIGNED)
-- =====================================================
CREATE TABLE IF NOT EXISTS Account (
    AccountNo INT UNSIGNED PRIMARY KEY,  -- Changed to INT UNSIGNED for 8-digit values
    CustomerID INT NOT NULL UNIQUE,
    Type ENUM('Savings', 'Current') NOT NULL,
    Balance DECIMAL(15,2) DEFAULT 0,
    Status ENUM('Active', 'Inactive', 'Closed') DEFAULT 'Active',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID) ON DELETE CASCADE
);

-- =====================================================
-- Table 3: SavingAccount
-- =====================================================
CREATE TABLE IF NOT EXISTS SavingAccount (
    AccountNo INT UNSIGNED PRIMARY KEY,  -- Changed from INT
    InterestRate DECIMAL(5,2) NOT NULL DEFAULT 3.50,
    FOREIGN KEY (AccountNo) REFERENCES Account(AccountNo) ON DELETE CASCADE
);

-- =====================================================
-- Table 4: CurrentAccount
-- =====================================================
CREATE TABLE IF NOT EXISTS CurrentAccount (
    AccountNo INT UNSIGNED PRIMARY KEY,  -- Changed from INT
    OverdraftLimit DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (AccountNo) REFERENCES Account(AccountNo) ON DELETE CASCADE
);

-- =====================================================
-- Table 5: TransactionLog (UPDATED)
-- =====================================================
CREATE TABLE IF NOT EXISTS TransactionLog (
    TransID INT PRIMARY KEY AUTO_INCREMENT,
    FromAccount INT UNSIGNED,  -- Changed from INT
    ToAccount INT UNSIGNED,    -- Changed from INT
    Amount DECIMAL(15,2) NOT NULL,
    Type ENUM('Deposit', 'Withdrawal', 'Transfer') NOT NULL,
    DateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Success', 'Failed', 'Rolled Back') DEFAULT 'Success',
    UserName VARCHAR(50) DEFAULT 'system',
    FOREIGN KEY (FromAccount) REFERENCES Account(AccountNo),
    FOREIGN KEY (ToAccount) REFERENCES Account(AccountNo)
);

-- =====================================================
-- Table 6: Deposit
-- =====================================================
CREATE TABLE IF NOT EXISTS Deposit (
    DepositID INT PRIMARY KEY AUTO_INCREMENT,
    TransID INT NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    DepositMethod ENUM('Cash', 'Cheque', 'Online') DEFAULT 'Cash',
    FOREIGN KEY (TransID) REFERENCES TransactionLog(TransID) ON DELETE CASCADE
);

-- =====================================================
-- Table 7: Withdrawal
-- =====================================================
CREATE TABLE IF NOT EXISTS Withdrawal (
    WithdrawalID INT PRIMARY KEY AUTO_INCREMENT,
    TransID INT NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    WithdrawalMethod ENUM('ATM', 'Counter', 'Online') DEFAULT 'Counter',
    FOREIGN KEY (TransID) REFERENCES TransactionLog(TransID) ON DELETE CASCADE
);

-- =====================================================
-- Table 8: Transfer
-- =====================================================
CREATE TABLE IF NOT EXISTS Transfer (
    TransferID INT PRIMARY KEY AUTO_INCREMENT,
    TransID INT NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    TransferType ENUM('Internal', 'External') DEFAULT 'Internal',
    FOREIGN KEY (TransID) REFERENCES TransactionLog(TransID) ON DELETE CASCADE
);

-- =====================================================
-- Table 9: AuditLog
-- =====================================================
CREATE TABLE IF NOT EXISTS AuditLog (
    LogID INT PRIMARY KEY AUTO_INCREMENT,
    Operation VARCHAR(50) NOT NULL,
    TableAffected VARCHAR(50) NOT NULL,
    RecordID INT,
    UserName VARCHAR(50) DEFAULT 'system',
    DateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    Details TEXT
);

-- =====================================================
-- Updated Stored Procedures with BIGINT support
-- =====================================================

DELIMITER $$

-- Deposit Procedure (Updated)
DROP PROCEDURE IF EXISTS sp_deposit $$
CREATE PROCEDURE sp_deposit(
    IN p_account_no BIGINT,  -- Changed from INT
    IN p_amount DECIMAL(15,2),
    IN p_method ENUM('Cash', 'Cheque', 'Online'),
    IN p_user VARCHAR(50)
)
BEGIN
    DECLARE v_current_balance DECIMAL(15,2);
    DECLARE v_trans_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        INSERT INTO AuditLog (Operation, TableAffected, UserName, Details)
        VALUES ('ROLLBACK', 'Account', p_user, CONCAT('Deposit failed for Account ', p_account_no));
        SELECT 'Error: Transaction rolled back' AS message;
    END;
    
    START TRANSACTION;
    
    SELECT Balance INTO v_current_balance FROM Account WHERE AccountNo = p_account_no FOR UPDATE;
    
    UPDATE Account 
    SET Balance = Balance + p_amount 
    WHERE AccountNo = p_account_no;
    
    INSERT INTO TransactionLog (ToAccount, Amount, Type, Status, UserName)
    VALUES (p_account_no, p_amount, 'Deposit', 'Success', p_user);
    
    SET v_trans_id = LAST_INSERT_ID();
    
    INSERT INTO Deposit (TransID, Amount, DepositMethod)
    VALUES (v_trans_id, p_amount, p_method);
    
    INSERT INTO AuditLog (Operation, TableAffected, RecordID, UserName, Details)
    VALUES ('COMMIT', 'Account', p_account_no, p_user, CONCAT('Deposit of ', p_amount, ' successful'));
    
    COMMIT;
    
    SELECT 'Success: Deposit completed' AS message, 
           v_current_balance + p_amount AS new_balance;
END $$

-- Withdraw Procedure (Updated)
DROP PROCEDURE IF EXISTS sp_withdraw $$
CREATE PROCEDURE sp_withdraw(
    IN p_account_no BIGINT,  -- Changed from INT
    IN p_amount DECIMAL(15,2),
    IN p_method ENUM('ATM', 'Counter', 'Online'),
    IN p_user VARCHAR(50)
)
BEGIN
    DECLARE v_current_balance DECIMAL(15,2);
    DECLARE v_trans_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        INSERT INTO AuditLog (Operation, TableAffected, UserName, Details)
        VALUES ('ROLLBACK', 'Account', p_user, CONCAT('Withdrawal failed for Account ', p_account_no));
        SELECT 'Error: Transaction rolled back' AS message;
    END;
    
    START TRANSACTION;
    
    SELECT Balance INTO v_current_balance FROM Account WHERE AccountNo = p_account_no FOR UPDATE;
    
    IF v_current_balance < p_amount THEN
        ROLLBACK;
        INSERT INTO AuditLog (Operation, TableAffected, RecordID, UserName, Details)
        VALUES ('ROLLBACK', 'Account', p_account_no, p_user, 'Insufficient balance');
        SELECT 'Error: Insufficient balance' AS message;
    ELSE
        UPDATE Account 
        SET Balance = Balance - p_amount 
        WHERE AccountNo = p_account_no;
        
        INSERT INTO TransactionLog (FromAccount, Amount, Type, Status, UserName)
        VALUES (p_account_no, p_amount, 'Withdrawal', 'Success', p_user);
        
        SET v_trans_id = LAST_INSERT_ID();
        
        INSERT INTO Withdrawal (TransID, Amount, WithdrawalMethod)
        VALUES (v_trans_id, p_amount, p_method);
        
        INSERT INTO AuditLog (Operation, TableAffected, RecordID, UserName, Details)
        VALUES ('COMMIT', 'Account', p_account_no, p_user, CONCAT('Withdrawal of ', p_amount, ' successful'));
        
        COMMIT;
        
        SELECT 'Success: Withdrawal completed' AS message, 
               v_current_balance - p_amount AS new_balance;
    END IF;
END $$

-- Transfer Procedure (Updated)
DROP PROCEDURE IF EXISTS sp_transfer $$
CREATE PROCEDURE sp_transfer(
    IN p_from_account BIGINT,  -- Changed from INT
    IN p_to_account BIGINT,    -- Changed from INT
    IN p_amount DECIMAL(15,2),
    IN p_user VARCHAR(50)
)
BEGIN
    DECLARE v_from_balance DECIMAL(15,2);
    DECLARE v_to_balance DECIMAL(15,2);
    DECLARE v_trans_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        INSERT INTO AuditLog (Operation, TableAffected, UserName, Details)
        VALUES ('ROLLBACK', 'Account', p_user, 
                CONCAT('Transfer failed from ', p_from_account, ' to ', p_to_account));
        SELECT 'Error: Transaction rolled back' AS message;
    END;
    
    START TRANSACTION;
    
    SELECT Balance INTO v_from_balance FROM Account WHERE AccountNo = p_from_account FOR UPDATE;
    SELECT Balance INTO v_to_balance FROM Account WHERE AccountNo = p_to_account FOR UPDATE;
    
    IF v_from_balance < p_amount THEN
        ROLLBACK;
        INSERT INTO AuditLog (Operation, TableAffected, RecordID, UserName, Details)
        VALUES ('ROLLBACK', 'Account', p_from_account, p_user, 'Insufficient balance for transfer');
        SELECT 'Error: Insufficient balance' AS message;
    ELSE
        UPDATE Account 
        SET Balance = Balance - p_amount 
        WHERE AccountNo = p_from_account;
        
        UPDATE Account 
        SET Balance = Balance + p_amount 
        WHERE AccountNo = p_to_account;
        
        INSERT INTO TransactionLog (FromAccount, ToAccount, Amount, Type, Status, UserName)
        VALUES (p_from_account, p_to_account, p_amount, 'Transfer', 'Success', p_user);
        
        SET v_trans_id = LAST_INSERT_ID();
        
        INSERT INTO Transfer (TransID, Amount, TransferType)
        VALUES (v_trans_id, p_amount, 'Internal');
        
        INSERT INTO AuditLog (Operation, TableAffected, RecordID, UserName, Details)
        VALUES ('COMMIT', 'Account', p_from_account, p_user, 
                CONCAT('Transfer of ', p_amount, ' to Account ', p_to_account, ' successful'));
        
        COMMIT;
        
        SELECT 'Success: Transfer completed' AS message,
               v_from_balance - p_amount AS sender_new_balance,
               v_to_balance + p_amount AS receiver_new_balance;
    END IF;
END $$

DELIMITER ;

-- If DB already exists, run these ALTER statements against the actual database used by the server:
SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE Account
  MODIFY COLUMN AccountNo INT UNSIGNED NOT NULL;

ALTER TABLE SavingAccount
  MODIFY COLUMN AccountNo INT UNSIGNED NOT NULL;

ALTER TABLE CurrentAccount
  MODIFY COLUMN AccountNo INT UNSIGNED NOT NULL;

ALTER TABLE TransactionLog
  MODIFY COLUMN FromAccount INT UNSIGNED,
  MODIFY COLUMN ToAccount INT UNSIGNED;

SET FOREIGN_KEY_CHECKS=1;