-- =====================================================
-- Core Banking System (CBS) - Sample Data & Test Cases
-- =====================================================

USE cbs;

-- =====================================================
-- Insert Sample Customers
-- =====================================================
INSERT INTO Customer (Name, CNIC, Contact) VALUES
('Muhammad Talha', '42201-1234567-1', '0300-1234567'),
('Faiza Ali', '42201-2345678-2', '0321-2345678'),
('Laiba Najeeb Khan', '42201-3456789-3', '0333-3456789');

-- =====================================================
-- Insert Sample Accounts
-- =====================================================
INSERT INTO Account (CustomerID, Type, Balance, Status) VALUES
(1, 'Savings', 50000.00, 'Active'),
(2, 'Current', 25000.00, 'Active'),
(3, 'Savings', 75000.00, 'Active');

-- =====================================================
-- Insert Saving Account Details
-- =====================================================
INSERT INTO SavingAccount (AccountNo, InterestRate) VALUES
(1, 3.50),
(3, 4.00);

-- =====================================================d:\Core_Banking_System-main
-- Insert Current Account Details
-- =====================================================
INSERT INTO CurrentAccount (AccountNo, OverdraftLimit) VALUES
(2, 5000.00);

-- =====================================================
-- Test Case 1: Successful Deposit (with COMMIT)
-- =====================================================
CALL sp_deposit(1, 10000.00, 'Cash', 'Muhammad Talha');

-- =====================================================
-- Test Case 2: Successful Withdrawal (with COMMIT)
-- =====================================================
CALL sp_withdraw(2, 5000.00, 'ATM', 'Muhammad Talha');

-- =====================================================
-- Test Case 3: Failed Withdrawal - Insufficient Balance (ROLLBACK)
-- =====================================================
CALL sp_withdraw(1, 100000.00, 'Counter', 'Muhammad Talha');

-- =====================================================
-- Test Case 4: Successful Transfer (Atomic with COMMIT)
-- =====================================================
CALL sp_transfer(3, 5, 15000.00, 'Faiza Ali');

-- =====================================================
-- Test Case 5: Failed Transfer - Insufficient Balance (ROLLBACK)
-- =====================================================
CALL sp_transfer(1, 3, 200000.00, 'Muhammad Talha');

-- =====================================================
-- Test Case 6: SAVEPOINT Demonstration
-- =====================================================
CALL sp_savepoint_demo('New Customer', '42201-9999999-9', '0300-9999999', 'Savings', 20000.00);

-- =====================================================
-- View All Customers
-- =====================================================
SELECT * FROM Customer;

-- =====================================================
-- View All Accounts with Customer Names
-- =====================================================
SELECT 
    a.AccountNo,
    c.Name AS CustomerName,
    a.Type,
    a.Balance,
    a.Status
FROM Account a
JOIN Customer c ON a.CustomerID = c.CustomerID;

-- =====================================================
-- View All Transactions
-- =====================================================
SELECT 
    t.TransID,
    t.FromAccount,
    t.ToAccount,
    t.Amount,
    t.Type,
    t.DateTime,
    t.Status
FROM TransactionLog t
ORDER BY t.DateTime DESC;

-- =====================================================
-- View All Deposits
-- =====================================================
SELECT 
    d.DepositID,
    t.ToAccount AS AccountNo,
    d.Amount,
    d.DepositMethod,
    t.DateTime
FROM Deposit d
JOIN TransactionLog t ON d.TransID = t.TransID;

-- =====================================================
-- View All Withdrawals
-- =====================================================
SELECT 
    w.WithdrawalID,
    t.FromAccount AS AccountNo,
    w.Amount,
    w.WithdrawalMethod,
    t.DateTime
FROM Withdrawal w
JOIN TransactionLog t ON w.TransID = t.TransID;

-- =====================================================
-- View All Transfers
-- =====================================================
SELECT 
    tr.TransferID,
    t.FromAccount,
    t.ToAccount,
    tr.Amount,
    tr.TransferType,
    t.DateTime
FROM Transfer tr
JOIN TransactionLog t ON tr.TransID = t.TransID;

-- =====================================================
-- View Audit Log (COMMIT/ROLLBACK History)
-- =====================================================
SELECT * FROM AuditLog ORDER BY DateTime DESC;

-- =====================================================
-- Customer Account Summary
-- =====================================================
SELECT 
    c.CustomerID,
    c.Name,
    c.CNIC,
    COUNT(a.AccountNo) AS TotalAccounts,
    SUM(a.Balance) AS TotalBalance
FROM Customer c
LEFT JOIN Account a ON c.CustomerID = a.CustomerID
GROUP BY c.CustomerID;

DELIMITER $$

-- Deposit Procedure (FIXED: Added UserName parameter and INSERT)
DROP PROCEDURE IF EXISTS sp_deposit $$
CREATE PROCEDURE sp_deposit(
    IN p_account_no INT UNSIGNED,
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
        SELECT 'Error: Transaction rolled back' AS message;
    END;
    
    START TRANSACTION;
    
    SELECT Balance INTO v_current_balance FROM Account WHERE AccountNo = p_account_no FOR UPDATE;
    
    UPDATE Account 
    SET Balance = Balance + p_amount 
    WHERE AccountNo = p_account_no;
    
    INSERT INTO TransactionLog (FromAccount, ToAccount, Amount, Type, Status, UserName)
    VALUES (NULL, p_account_no, p_amount, 'Deposit', 'Success', p_user);
    
    SET v_trans_id = LAST_INSERT_ID();
    
    INSERT INTO Deposit (TransID, Amount, DepositMethod)
    VALUES (v_trans_id, p_amount, p_method);
    
    COMMIT;
    SELECT 'Success' AS status, v_trans_id AS TransID, p_account_no AS AccountNo;
END $$

-- Withdraw Procedure (FIXED: Complete implementation)
DROP PROCEDURE IF EXISTS sp_withdraw $$
CREATE PROCEDURE sp_withdraw(
    IN p_account_no INT UNSIGNED,
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
        SELECT 'Error: Transaction rolled back' AS message;
    END;
    
    START TRANSACTION;
    
    SELECT Balance INTO v_current_balance FROM Account WHERE AccountNo = p_account_no FOR UPDATE;
    
    IF v_current_balance < p_amount THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;
    
    UPDATE Account 
    SET Balance = Balance - p_amount 
    WHERE AccountNo = p_account_no;
    
    INSERT INTO TransactionLog (FromAccount, ToAccount, Amount, Type, Status, UserName)
    VALUES (p_account_no, NULL, p_amount, 'Withdrawal', 'Success', p_user);
    
    SET v_trans_id = LAST_INSERT_ID();
    
    INSERT INTO Withdrawal (TransID, Amount, WithdrawalMethod)
    VALUES (v_trans_id, p_amount, p_method);
    
    COMMIT;
    SELECT 'Success' AS status, v_trans_id AS TransID, p_account_no AS AccountNo;
END $$

-- Transfer Procedure (FIXED: Complete implementation)
DROP PROCEDURE IF EXISTS sp_transfer $$
CREATE PROCEDURE sp_transfer(
    IN p_from_account INT UNSIGNED,
    IN p_to_account INT UNSIGNED,
    IN p_amount DECIMAL(15,2),
    IN p_user VARCHAR(50)
)
BEGIN
    DECLARE v_from_balance DECIMAL(15,2);
    DECLARE v_trans_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Transaction rolled back' AS message;
    END;
    
    START TRANSACTION;
    
    SELECT Balance INTO v_from_balance FROM Account WHERE AccountNo = p_from_account FOR UPDATE;
    
    IF v_from_balance < p_amount THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;
    
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
    
    COMMIT;
    SELECT 'Success' AS status, v_trans_id AS TransID, p_from_account AS FromAccount, p_to_account AS ToAccount;
END $$

DELIMITER ;