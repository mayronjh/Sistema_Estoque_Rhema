// Carregar dados do localStorage
const loadFromLocalStorage = () => {
    return {
        users: JSON.parse(localStorage.getItem('users')) || [],
        items: JSON.parse(localStorage.getItem('items')) || [],
        sales: JSON.parse(localStorage.getItem('sales')) || [],
        history: JSON.parse(localStorage.getItem('history')) || []
    };
};

// Salvar dados no localStorage
const saveToLocalStorage = (data) => {
    localStorage.setItem('users', JSON.stringify(data.users));
    localStorage.setItem('items', JSON.stringify(data.items));
    localStorage.setItem('sales', JSON.stringify(data.sales));
    localStorage.setItem('history', JSON.stringify(data.history));
};

let { users, items, sales, history } = loadFromLocalStorage();
let loggedInUser = null; // Usuário atualmente logado

// Funções de Login e Registro
function showRegister() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
}

function showLogin() {
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        loggedInUser = user;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainSection').style.display = 'block';
        document.getElementById('logoutButton').style.display = 'block';
        loadInventoryTable();
        loadSalesTable();
        loadHistoryTable();
        loadUserTable();
        checkUserRole();
    } else {
        document.getElementById('loginMessage').innerText = 'Usuário ou senha incorretos.';
    }
}

function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    
    if (username && password && role) {
        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            document.getElementById('registerMessage').innerText = 'Usuário já existe.';
        } else {
            users.push({ username, password, role });
            saveToLocalStorage({ users, items, sales, history });
            document.getElementById('registerMessage').innerText = 'Usuário registrado com sucesso.';
            showLogin();
        }
    } else {
        document.getElementById('registerMessage').innerText = 'Por favor, preencha todos os campos.';
    }
}

// Funções para Estoque
function addItem() {
    const name = document.getElementById('itemName').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    const value = parseFloat(document.getElementById('itemValue').value);

    if (name && quantity > 0 && value > 0) {
        const code = items.length ? Math.max(...items.map(item => item.code)) + 1 : 1;
        items.push({ code, name, quantity, value });
        saveToLocalStorage({ users, items, sales, history });
        loadInventoryTable();
        document.getElementById('itemName').value = '';
        document.getElementById('itemQuantity').value = '';
        document.getElementById('itemValue').value = '';
    } else {
        alert('Por favor, preencha todos os campos corretamente.');
    }
}

function loadInventoryTable() {
    if (loggedInUser.role === 'vendedor') {
        document.getElementById('inventorySection').style.display = 'none';
        return;
    }

    const table = document.getElementById('inventoryTable');
    table.innerHTML = `
        <tr>
            <th>Cód. Item</th>
            <th>Nome do Item</th>
            <th>Quantidade</th>
            <th>Valor</th>
            <th>Ações</th>
        </tr>
    `;
    
    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.value.toFixed(2)}</td>
            <td>
                <button onclick="editItem(${item.code})">Editar</button>
                <button onclick="deleteItem(${item.code})">Excluir</button>
            </td>
        `;
        table.appendChild(row);
    });
}

function editItem(code) {
    const item = items.find(i => i.code === code);
    if (item) {
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemQuantity').value = item.quantity;
        document.getElementById('itemValue').value = item.value;
        deleteItem(code);
    }
}

function deleteItem(code) {
    if (loggedInUser.role === 'vendedor') {
        alert('Você não tem permissão para excluir itens.');
        return;
    }

    items = items.filter(i => i.code !== code);
    saveToLocalStorage({ users, items, sales, history });
    loadInventoryTable();
}

// Funções para Vendas
function populateItemDetails() {
    const code = parseInt(document.getElementById('saleItemCode').value);
    const item = items.find(i => i.code === code);
    
    if (item) {
        document.getElementById('saleItemName').value = item.name;
        document.getElementById('itemQuantityAvailable').value = item.quantity;
    } else {
        document.getElementById('saleItemName').value = '';
        document.getElementById('itemQuantityAvailable').value = '';
    }
}

function toggleInstallments() {
    const paymentType = document.getElementById('paymentType').value;
    document.getElementById('installmentsContainer').style.display = paymentType === 'credito' ? 'block' : 'none';
}

function addSale() {
    const code = parseInt(document.getElementById('saleItemCode').value);
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const paymentType = document.getElementById('paymentType').value;
    const installments = paymentType === 'credito' ? parseInt(document.getElementById('installments').value) : 0;
    const item = items.find(i => i.code === code);

    if (item && quantity > 0 && quantity <= item.quantity) {
        const totalValue = quantity * item.value;
        const sale = {
            code,
            name: item.name,
            quantity,
            totalValue,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            paymentType,
            installments,
            responsible: loggedInUser.username // Adiciona o nome do vendedor
        };
        sales.push(sale);
        item.quantity -= quantity;
        history.push(sale);
        saveToLocalStorage({ users, items, sales, history });
        loadSalesTable();
        loadHistoryTable();
        populateItemDetails();
    } else {
        alert('Quantidade inválida ou item não encontrado.');
    }
}

function loadSalesTable() {
    if (loggedInUser.role === 'vendedor') {
        document.getElementById('salesSection').style.display = 'block';
        return;
    }

    const table = document.getElementById('salesTable');
    table.innerHTML = `
        <tr>
            <th>Cód. Item</th>
            <th>Nome do Item</th>
            <th>Quantidade</th>
            <th>Valor Total</th>
            <th>Data</th>
            <th>Horário</th>
            <th>Tipo de Pagamento</th>
            <th>Parcelas</th>
            <th>Ações</th>
        </tr>
    `;
    
    sales.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.code}</td>
            <td>${sale.name}</td>
            <td>${sale.quantity}</td>
            <td>${sale.totalValue.toFixed(2)}</td>
            <td>${sale.date}</td>
            <td>${sale.time}</td>
            <td>${sale.paymentType}</td>
            <td>${sale.installments || '-'}</td>
            <td>
                <button onclick="deleteSale(${sale.code})">Excluir</button>
            </td>
        `;
        table.appendChild(row);
    });
}

function deleteSale(code) {
    if (loggedInUser.role === 'vendedor') {
        alert('Você não tem permissão para excluir vendas.');
        return;
    }

    const saleIndex = sales.findIndex(s => s.code === code);
    if (saleIndex > -1) {
        const sale = sales[saleIndex];
        const item = items.find(i => i.code === sale.code);
        if (item) {
            item.quantity += sale.quantity;
        }
        requestAdminConfirmation(() => {
            sales.splice(saleIndex, 1);
            history.splice(history.findIndex(h => h.code === sale.code && h.date === sale.date && h.time === sale.time), 1);
            saveToLocalStorage({ users, items, sales, history });
            loadSalesTable();
            loadHistoryTable();
        });
    }
}

function loadHistoryTable() {
    if (loggedInUser.role === 'vendedor') {
        document.getElementById('historySection').style.display = 'block';
        return;
    }

    const table = document.getElementById('historyTable');
    table.innerHTML = `
        <tr>
            <th>Cód. Item</th>
            <th>Nome do Item</th>
            <th>Quantidade Vendida</th>
            <th>Valor Total</th>
            <th>Data</th>
            <th>Horário</th>
            <th>Tipo de Pagamento</th>
            <th>Parcelas</th>
            <th>Responsável</th>
            <th>Ações</th>
        </tr>
    `;
    
    history.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.code}</td>
            <td>${record.name}</td>
            <td>${record.quantity}</td>
            <td>${record.totalValue.toFixed(2)}</td>
            <td>${record.date}</td>
            <td>${record.time}</td>
            <td>${record.paymentType}</td>
            <td>${record.installments || '-'}</td>
            <td>${record.responsible}</td>
            <td>
                <button onclick="deleteHistoryRecord(${record.code})">Excluir</button>
            </td>
        `;
        table.appendChild(row);
    });
}

function deleteHistoryRecord(code) {
    if (loggedInUser.role === 'vendedor') {
        alert('Você não tem permissão para excluir registros do histórico.');
        return;
    }

    requestAdminConfirmation(() => {
        history = history.filter(h => h.code !== code);
        saveToLocalStorage({ users, items, sales, history });
        loadHistoryTable();
    });
}

// Função para confirmar ação do admin
function requestAdminConfirmation(callback) {
    const username = prompt('Digite o nome de usuário do admin:');
    const password = prompt('Digite a senha do admin:');
    const admin = users.find(u => u.username === username && u.password === password && u.role === 'admin');

    if (admin) {
        callback();
    } else {
        alert('Credenciais de admin inválidas.');
    }
}

// Funções para Gerenciamento de Usuários
function loadUserTable() {
    if (loggedInUser.role === 'vendedor') {
        document.getElementById('userManagement').style.display = 'none';
        return;
    }

    const table = document.getElementById('userTable');
    table.innerHTML = `
        <tr>
            <th>Nome de Usuário</th>
            <th>Perfil</th>
            <th>Ações</th>
        </tr>
    `;
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.role}</td>
            <td>
                <button onclick="loadUserDetails('${user.username}')">Gerenciar</button>
            </td>
        `;
        table.appendChild(row);
    });
}

function loadUserDetails(username) {
    if (loggedInUser.role === 'vendedor') {
        alert('Você não tem permissão para gerenciar usuários.');
        return;
    }

    const user = users.find(u => u.username === username);
    if (user) {
        document.getElementById('manageUsername').value = user.username;
        document.getElementById('userDetails').style.display = 'block';
    }
}

function resetPassword() {
    if (loggedInUser.role === 'vendedor') {
        alert('Você não tem permissão para redefinir senhas.');
        return;
    }

    const username = document.getElementById('manageUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    const user = users.find(u => u.username === username);
    
    if (user && newPassword) {
        user.password = newPassword;
        saveToLocalStorage({ users, items, sales, history });
        alert('Senha resetada com sucesso.');
    } else {
        alert('Usuário não encontrado ou nova senha inválida.');
    }
}

function changeUserRole() {
    if (loggedInUser.role === 'vendedor') {
        alert('Você não tem permissão para alterar perfis de usuário.');
        return;
    }

    const username = document.getElementById('manageUsername').value;
    const newRole = document.getElementById('newRole').value;
    const user = users.find(u => u.username === username);
    
    if (user) {
        user.role = newRole;
        saveToLocalStorage({ users, items, sales, history });
        alert('Perfil alterado com sucesso.');
        loadUserTable();
    } else {
        alert('Usuário não encontrado.');
    }
}

function deleteUser() {
    if (loggedInUser.role === 'vendedor') {
        alert('Você não tem permissão para excluir usuários.');
        return;
    }

    const username = document.getElementById('manageUsername').value;
    users = users.filter(u => u.username !== username);
    saveToLocalStorage({ users, items, sales, history });
    document.getElementById('userDetails').style.display = 'none';
    loadUserTable();
    alert('Usuário excluído com sucesso.');
}

// Funções de Exportação
function saveToExcel(data, filename) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
}

function saveStockToExcel() {
    saveToExcel(items, 'estoque.xlsx');
}

function saveSalesToExcel() {
    saveToExcel(sales, 'vendas.xlsx');
}

function saveHistoryToExcel() {
    saveToExcel(history, 'historico.xlsx');
}

// Função de Logout
function logout() {
    loggedInUser = null;
    document.getElementById('mainSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'none';
    document.getElementById('registerSection').style.display = 'none';

}

// Função para verificar o perfil do usuário e habilitar/desabilitar funcionalidades
function checkUserRole() {
    if (loggedInUser.role === 'admin') {
        document.querySelectorAll('.tab-button').forEach(button => button.style.display = 'inline-block');
        document.getElementById('userManagement').style.display = 'block';
    } else {
        document.querySelectorAll('.tab-button').forEach(button => button.style.display = 'inline-block');
        document.getElementById('userManagement').style.display = 'none';
    }

    if (loggedInUser.role === 'vendedor') {
        document.getElementById('inventorySection').style.display = 'none';
        document.getElementById('userManagement').style.display = 'none';
    }
}

// Função para abrir as abas
function openTab(evt, tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.style.display = 'none');

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.classList.add('active');
}
