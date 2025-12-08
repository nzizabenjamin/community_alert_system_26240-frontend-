import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  Table, 
  Pagination,
  Modal,
  Badge,
  SearchBar,
  StatCard,
  Alert,
  Select,
  Textarea
} from '../components/common';
import { AlertCircle, Users, CheckCircle, TrendingUp } from 'lucide-react';

export const TestPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [alert, setAlert] = useState(null);

  // Sample table data
  const tableData = [
    { id: 1, name: 'John Doe', status: 'Active', role: 'Admin' },
    { id: 2, name: 'Jane Smith', status: 'Inactive', role: 'User' },
    { id: 3, name: 'Bob Johnson', status: 'Active', role: 'User' },
  ];

  const tableColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'danger'}>
          {row.status}
        </Badge>
      )
    },
    { header: 'Role', accessor: 'role' }
  ];

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Component Testing Page</h1>
        <p className="text-gray-600 mt-2">Test all reusable components</p>
      </div>

      {/* Alerts */}
      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)}
        />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Issues"
          value="247"
          icon={AlertCircle}
          trend={12}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value="1,234"
          icon={Users}
          trend={5}
          color="green"
        />
        <StatCard
          title="Resolved"
          value="189"
          icon={CheckCircle}
          trend={-3}
          color="green"
        />
        <StatCard
          title="Growth"
          value="23%"
          icon={TrendingUp}
          trend={8}
          color="purple"
        />
      </div>

      {/* Buttons */}
      <Card title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button 
            variant="primary" 
            icon={AlertCircle}
            onClick={() => setAlert({ type: 'success', message: 'Button clicked!' })}
          >
            With Icon
          </Button>
        </div>
      </Card>

      {/* Form Inputs */}
      <Card title="Form Elements">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Text Input"
            placeholder="Enter text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            icon={Users}
          />
          <Input
            label="Required Input"
            placeholder="This is required"
            required
            error="This field is required"
          />
          <Select
            label="Select Dropdown"
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            options={selectOptions}
            required
          />
          <Input
            label="Disabled Input"
            placeholder="Can't edit this"
            disabled
            value="Disabled value"
            onChange={() => {}}
          />
        </div>
        <Textarea
          label="Textarea"
          placeholder="Enter a long description..."
          value={textareaValue}
          onChange={(e) => setTextareaValue(e.target.value)}
          rows={4}
        />
      </Card>

      {/* Search Bar */}
      <Card title="Search">
        <SearchBar
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search anything..."
        />
        {searchValue && (
          <p className="mt-2 text-sm text-gray-600">
            Searching for: <strong>{searchValue}</strong>
          </p>
        )}
      </Card>

      {/* Badges */}
      <Card title="Badges">
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </Card>

      {/* Table */}
      <Card title="Table" noPadding>
        <Table
          columns={tableColumns}
          data={tableData}
          onRowClick={(row) => setAlert({ type: 'info', message: `Clicked on ${row.name}` })}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={5}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* Modal */}
      <Card title="Modal">
        <Button onClick={() => setShowModal(true)}>
          Open Modal
        </Button>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Test Modal"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  setAlert({ type: 'success', message: 'Modal action confirmed!' });
                  setShowModal(false);
                }}
              >
                Confirm
              </Button>
            </>
          }
        >
          <p className="text-gray-600">
            This is a test modal. You can put any content here.
          </p>
          <Input
            label="Test Input in Modal"
            placeholder="Type something..."
            className="mt-4"
          />
        </Modal>
      </Card>

      {/* Alert Examples */}
      <Card title="Alert Examples">
        <div className="space-y-3">
          <Button 
            variant="success" 
            onClick={() => setAlert({ type: 'success', message: 'Operation successful!' })}
          >
            Show Success Alert
          </Button>
          <Button 
            variant="danger" 
            onClick={() => setAlert({ type: 'error', message: 'Something went wrong!' })}
          >
            Show Error Alert
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setAlert({ type: 'warning', message: 'This is a warning!' })}
          >
            Show Warning Alert
          </Button>
          <Button 
            onClick={() => setAlert({ type: 'info', message: 'Here is some information.' })}
          >
            Show Info Alert
          </Button>
        </div>
      </Card>
    </div>
  );
};
